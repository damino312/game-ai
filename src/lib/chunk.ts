export function chunkText(input: string, chunkSize = 1200, overlap = 200) {
  const text = input.replace(/\s+/g, " ").trim();
  if (!text) return [];

  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    const c = text.slice(i, end).trim();
    if (c) chunks.push(c);
    if (end === text.length) break;
    i = Math.max(0, end - overlap);
  }
  return chunks;
}
