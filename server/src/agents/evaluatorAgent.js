function evaluatorAgent({ type, citations = [], output = {}, chunks = [] }) {
  const confidence = chunks.length ? Math.min(0.95, 0.45 + citations.length * 0.08 + Math.min(chunks.length, 5) * 0.04) : 0.15;
  const hasContent = Object.values(output).some((value) => typeof value === 'string' ? value.length > 0 : Array.isArray(value) && value.length > 0);
  const note = !hasContent
    ? 'No response content was produced.'
    : chunks.length
      ? `${type} completed using ${chunks.length} retrieved context chunk(s) and ${citations.length} citation(s).`
      : 'No indexed document context was available; the response uses a safe fallback.';
  return { note, confidence };
}

module.exports = evaluatorAgent;
