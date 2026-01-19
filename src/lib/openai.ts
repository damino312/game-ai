import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
  const res = await openai.embeddings.create({
    model,
    input: texts,
  });
  return res.data.map((x) => x.embedding);
}
