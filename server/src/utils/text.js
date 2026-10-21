function cleanText(text = '') {
  return String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tokenize(text = '') {
  return cleanText(text).toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function splitSentences(text = '') {
  return cleanText(text).split(/(?<=[.!?])\s+|\n+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function summarizeFallback(text = '', sentenceLimit = 4) {
  return splitSentences(text).slice(0, sentenceLimit).join(' ');
}

function extractActionItems(text = '') {
  return cleanText(text)
    .split('\n')
    .filter((line) => /^\s*(?:[-*•]\s+|(?:todo|action item|next step)\s*:?)/i.test(line))
    .map((line) => line.replace(/^\s*(?:[-*•]\s+|(?:todo|action item|next step)\s*:?\s*)/i, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function topKeywords(text = '', limit = 8) {
  const counts = new Map();
  for (const token of tokenize(text)) {
    if (token.length >= 3) counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

function paragraphSplit(text = '') {
  return cleanText(text).split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

module.exports = {
  cleanText,
  tokenize,
  splitSentences,
  summarizeFallback,
  extractActionItems,
  topKeywords,
  paragraphSplit
};
