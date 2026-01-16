import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getMemoryCollection } from "@/lib/chroma";
import { embedTexts, openai } from "@/lib/openai";
import { indexChatMessage } from "@/lib/memory-index";

export const runtime = "nodejs";

/**
 * Идея:
 * - История (порядок) хранится в Postgres (Message).
 * - Векторная "память" хранится в Chroma (семантический поиск по прошлым репликам).
 * - Индексируем "почти все" сообщения автоматически (фильтр в memory-index.ts).
 * - В prompt отправляем:
 *   1) systemPrompt компаньона
 *   2) MEMORY из Chroma (topK похожих реплик)
 *   3) HISTORY (последние N сообщений по порядку)
 */

const Body = z.object({
  conversationId: z.string().nullable().optional(),
  companionId: z.string().min(1),
  message: z.string().min(1),
});

function toLLMMessages(
  rows: { role: string; content: string }[]
): { role: "user" | "assistant"; content: string }[] {
  return rows
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export async function POST(req: Request) {
  const { userId } = await requireUser();
  const body = Body.parse(await req.json());

  // 1) Ensure conversation (только по conversationId + userId)
  const existing = body.conversationId
    ? await prisma.conversation.findFirst({
        where: { id: body.conversationId, userId },
        include: { companion: true },
      })
    : null;

  const conv =
    existing ??
    (await prisma.conversation.create({
      data: {
        userId,
        companionId: body.companionId,
        title: "Skyrim chat",
      },
      include: { companion: true },
    }));

  // 2) Save user message
  const userMsg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      role: "user",
      content: body.message,
    },
  });

  // 3) Index user message into Chroma (память диалога)
  await indexChatMessage({
    userId,
    companionId: body.companionId,
    conversationId: conv.id,
    messageId: userMsg.id,
    role: "user",
    content: userMsg.content,
    createdAtISO: userMsg.createdAt.toISOString(),
  });

  // 4) Load recent history (последние 20 сообщений, но в правильном порядке)
  const historyRowsDesc = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const recentHistory = toLLMMessages(historyRowsDesc).reverse();

  // 5) Retrieval from Chroma (семантическая память по пользователю+компаньону)
  const [qVec] = await embedTexts([body.message]);
  const col = await getMemoryCollection();

  const retrieved = await col.query({
    queryEmbeddings: [qVec],
    nResults: 8,
    where: {
      $and: [{ userId }, { companionId: body.companionId }],
      // Если хочешь ограничить только этим разговором, включи:
      // $and: [{ userId }, { companionId: body.companionId }, { conversationId: conv.id }],
    },
    include: ["documents", "metadatas", "distances"],
  });

  const docs = retrieved.documents?.[0] ?? [];
  const metas = retrieved.metadatas?.[0] ?? [];

  // 6) Build MEMORY block (dedupe)
  const seen = new Set<string>();
  const memoryLines: string[] = [];
  for (let i = 0; i < docs.length; i++) {
    const text = (docs[i] ?? "").trim();
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const role = (metas[i] as any)?.role ?? "chat";
    memoryLines.push(`- (${role}) ${text}`);
  }

  const memoryBlock = memoryLines.join("\n");

  // 7) System prompt
  const system = [
    conv.companion.systemPrompt,
    "",
    "Правила:",
    "- Отвечай по-русски.",
    "- Если пользователь спрашивает 'о чём мы говорили', используй HISTORY и MEMORY.",
    "- Не выдумывай факты о пользователе, если их нет в MEMORY/HISTORY.",
    "- Если запрос про насилие/убийства — отказывай и предлагай безопасные альтернативы.",
  ].join("\n");

  // 8) Call model
  const model = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      {
        role: "system",
        content: `MEMORY (semantic):\n${memoryBlock || "(empty)"}`,
      },
      {
        role: "system",
        content:
          "HISTORY:\n" +
          (recentHistory.length
            ? recentHistory
                .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
                .join("\n")
            : "(empty)"),
      },
      // ВАЖНО: не добавляем body.message ещё раз, т.к. он уже есть в HISTORY
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? "";

  // 9) Save assistant message
  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      role: "assistant",
      content: answer,
    },
  });

  // 10) Index assistant message too (память диалога)
  await indexChatMessage({
    userId,
    companionId: body.companionId,
    conversationId: conv.id,
    messageId: assistantMsg.id,
    role: "assistant",
    content: assistantMsg.content,
    createdAtISO: assistantMsg.createdAt.toISOString(),
  });

  // 11) Touch conversation updatedAt (если вдруг у тебя не @updatedAt)
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    conversationId: conv.id,
    companion: { id: conv.companion.id, name: conv.companion.name },
    usedMemoryCount: docs.length,
    answer,
  });
}
