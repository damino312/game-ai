import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const Query = z.object({
  companionId: z.string().min(1),
});

export async function GET(req: Request) {
  const { userId } = await requireUser();
  const url = new URL(req.url);
  const { companionId } = Query.parse({
    companionId: url.searchParams.get("companionId"),
  });

  // Берём самый свежий разговор пользователя с этим компаньоном
  let conv = await prisma.conversation.findFirst({
    where: { userId, companionId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  // Если ещё не общались — создаём пустой
  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        userId,
        companionId,
        title: "Skyrim chat",
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  return NextResponse.json({
    ok: true,
    conversationId: conv.id,
    messages: conv.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
