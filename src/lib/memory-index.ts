import crypto from "crypto";
import { getMemoryCollection } from "@/lib/chroma";
import { embedTexts } from "@/lib/openai";

function shouldIndex(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (t.length < 10) return false; // убираем мусор типа "ок"
  return true;
}

export async function indexChatMessage(params: {
  userId: string;
  companionId: string;
  conversationId: string;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  createdAtISO: string;
}) {
  const {
    userId,
    companionId,
    conversationId,
    messageId,
    role,
    content,
    createdAtISO,
  } = params;

  if (!shouldIndex(content)) return { indexed: 0 };

  const col = await getMemoryCollection();

  // 1 документ = 1 сообщение (можно chunk’ать позже)
  const doc = content.trim();
  const [emb] = await embedTexts([doc]);

  const id = crypto
    .createHash("sha1")
    .update(`${userId}:${conversationId}:${messageId}`)
    .digest("hex");

  await col.add({
    ids: [id],
    documents: [doc],
    embeddings: [emb],
    metadatas: [
      {
        userId,
        companionId,
        conversationId,
        messageId,
        role,
        kind: "chat",
        createdAt: createdAtISO,
      },
    ],
  });

  return { indexed: 1 };
}
