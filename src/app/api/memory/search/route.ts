import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getMemoryCollection } from "@/lib/chroma";
import { embedTexts } from "@/lib/openai";

export const runtime = "nodejs";

const Body = z.object({
  query: z.string().min(1),
  topK: z.number().int().min(1).max(20).default(6),
  companionId: z.string().optional(),
  kind: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await requireUser();
  const body = Body.parse(await req.json());

  const [qVec] = await embedTexts([body.query]);
  const col = await getMemoryCollection();

  // where фильтр по метаданным
  const where: Record<string, any> = { userId };
  if (body.companionId) where.companionId = body.companionId;
  if (body.kind) where.kind = body.kind;

  const res = await col.query({
    queryEmbeddings: [qVec],
    nResults: body.topK,
    where,
    include: ["documents", "metadatas", "distances"],
  });

  const docs = res.documents?.[0] ?? [];
  const metas = res.metadatas?.[0] ?? [];
  const distances = res.distances?.[0] ?? [];

  return NextResponse.json({
    ok: true,
    items: docs.map((content, i) => ({
      content,
      metadata: metas[i],
      distance: distances[i],
    })),
  });
}
