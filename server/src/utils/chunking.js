const { paragraphSplit, cleanText } = require('./text');

function approxTokenCount(text = '') {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

function chunkText(text = '', targetSize = 1200, overlap = 200) {
  const paragraphs = paragraphSplit(cleanText(text));
  const segments = [];
  const maxWords = Math.max(1, Math.floor(targetSize / 1.3));
  const overlapWords = Math.min(Math.max(0, Math.floor(overlap / 1.3)), maxWords - 1);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    if (words.length <= maxWords) {
      segments.push(paragraph);
      continue;
    }
    for (let start = 0; start < words.length;) {
      const end = Math.min(start + maxWords, words.length);
      segments.push(words.slice(start, end).join(' '));
      if (end === words.length) break;
      start = end - overlapWords;
    }
  }

  const chunks = [];
  let current = '';
  for (const segment of segments) {
    const combined = current ? `${current}\n\n${segment}` : segment;
    if (current && approxTokenCount(combined) > targetSize) {
      chunks.push(current);
      current = segment;
    } else {
      current = combined;
    }
  }
  if (current) chunks.push(current);

  return chunks.map((chunk, chunkIndex) => ({
    chunkIndex,
    text: chunk,
    tokenCountApprox: approxTokenCount(chunk),
    metadata: {}
  }));
}

module.exports = {
  chunkText,
  approxTokenCount
};
