import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { requireUser } from "@/lib/session";
import { getMemoryCollection } from "@/lib/chroma";
import { chunkText } from "@/lib/chunk";
import { embedTexts } from "@/lib/openai";

export const runtime = "nodejs";

const Body = z.object({
  content: z.string().min(1),
  kind: z.string().default("note"),
  companionId: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await requireUser();
  const body = Body.parse(await req.json());

  const content = body.content.trim();
  const kind = body.kind.trim() || "note";

  const createdAtISO = new Date().toISOString();

  const chunks = chunkText(content);
  if (!chunks.length) {
    return NextResponse.json({ ok: true, added: 0 });
  }

  const embeddings = await embedTexts(chunks);
  const col = await getMemoryCollection();

  const companionKey = body.companionId ?? "__any__";

  // Стабильный baseId: одинаковый content -> одинаковые ids (не плодим дубли при ретраях)
  const baseId = crypto
    .createHash("sha1")
    .update(`v1:${userId}:${companionKey}:${kind}:${content}`)
    .digest("hex");

  const ids = chunks.map((_c, idx) =>
    crypto.createHash("sha1").update(`v1:${baseId}:${idx}`).digest("hex")
  );

  const metadatas = chunks.map((_c, idx) => ({
    userId,
    companionId: companionKey, // всегда string, без null
    kind,
    source: "manual", // пометка, что добавлено руками (если пригодится)
    baseId,
    chunkIndex: idx,
    createdAt: createdAtISO,
  }));

  await col.add({
    ids,
    documents: chunks,
    embeddings,
    metadatas,
  });

  return NextResponse.json({
    ok: true,
    added: chunks.length,
    baseId,
  });
}
