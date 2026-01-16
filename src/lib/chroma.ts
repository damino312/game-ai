import { CloudClient } from "chromadb";

export const chroma = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY!,
  tenant: process.env.CHROMA_TENANT!,
  database: process.env.CHROMA_DATABASE!,
});

export async function getMemoryCollection() {
  return chroma.getOrCreateCollection({
    name: process.env.CHROMA_COLLECTION ?? "skyrim-memory",
    metadata: { "hnsw:space": "cosine" },
  });
}
