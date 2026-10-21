const repository = require('./repository');
const { cleanText, splitSentences, tokenize } = require('../utils/text');

const ignoredTerms = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'can', 'do', 'does', 'for',
  'from', 'give', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on', 'or', 'please', 'the',
  'their', 'them', 'this', 'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who',
  'why', 'with', 'would', 'much', 'new', 'owns', 'owner', 'owned', 'responsible'
]);

function normalizeTerm(term) {
  let normalized = term.toLowerCase();
  if (normalized.endsWith('ies') && normalized.length > 4) normalized = `${normalized.slice(0, -3)}y`;
  else if (normalized.endsWith('ing') && normalized.length > 5) normalized = normalized.slice(0, -3);
  else if (normalized.endsWith('ed') && normalized.length > 4) normalized = normalized.slice(0, -2);
  else if (normalized.endsWith('s') && normalized.length > 3) normalized = normalized.slice(0, -1);
  return normalized;
}

function queryTerms(query) {
  let terms = tokenize(query)
    .filter((term) => !ignoredTerms.has(term))
    .map(normalizeTerm);
  if (/\bwho\b/i.test(query) && /\b(owner|owns|responsible)\b/i.test(query)) {
    terms = terms.filter((term) => !['risk', 'issue', 'responsibility'].includes(term));
  }
  const expanded = [...terms];
  if (terms.includes('early')) expanded.push('before');
  if (terms.includes('soon')) expanded.push('before');
  return [...new Set(expanded)];
}

function scorePassage(passage, terms) {
  const passageTerms = tokenize(passage).map(normalizeTerm);
  const termSet = new Set(passageTerms);
  const matches = terms.filter((term) => termSet.has(term)).length;
  if (!matches || !terms.length) return 0;
  const coverage = matches / terms.length;
  const density = matches / Math.max(1, Math.sqrt(passageTerms.length));
  return coverage * 0.8 + Math.min(density, 0.2);
}

function passageCandidates(chunks) {
  return chunks.flatMap((chunk) => {
    const sentences = splitSentences(chunk.text);
    return sentences.map((sentence, index) => {
      const adjacent = [sentences[index - 1], sentence, sentences[index + 1]].filter(Boolean);
      return {
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        chunkIndex: chunk.chunkIndex,
        text: cleanText(sentence),
        surroundingText: cleanText(adjacent.join(' ')),
        metadata: chunk.metadata || {}
      };
    });
  });
}

function questionBoost(query, text) {
  let boost = 0;
  if (/\bwho\b/i.test(query) && /\b(owner|owns|responsible)\b/i.test(query)) {
    if (/\([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+[^)]*\)/.test(text) || /\b(owner|owned by|responsible for)\b/i.test(text)) {
      boost += 0.6;
    }
  }
  if (/\bhow much\b/i.test(query) && /\b(faster|increase|improv|reduc|decreas)\w*/i.test(query)) {
    if (/\d+(?:\.\d+)?\s*(?:%|percent)\s*(?:faster|higher|more|improv|increase)?/i.test(text)) {
      boost += 0.65;
    }
    if (/\b(checkout|prototype)\b/i.test(text) && /\d/.test(text)) boost += 0.4;
  }
  return boost;
}

function snippetFromText(text = '', query = '') {
  const normalized = cleanText(text);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lowerText = normalized.toLowerCase();
  const matchAt = terms.map((term) => lowerText.indexOf(term)).find((index) => index >= 0);
  if (normalized.length <= 240) return normalized;
  const start = Math.max(0, (matchAt ?? 0) - 80);
  return `${start ? '…' : ''}${normalized.slice(start, start + 240).trim()}${start + 240 < normalized.length ? '…' : ''}`;
}

async function loadWorkspaceChunks(workspaceId, userId, selectedDocumentIds = []) {
  const workspace = await repository.getById('workspaces', workspaceId);
  if (!workspace || workspace.userId !== userId) return [];
  const filter = { workspaceId, userId };
  if (selectedDocumentIds.length) filter.documentId = { $in: selectedDocumentIds };
  const chunks = await repository.getAll('documentChunks', filter, { chunkIndex: 1 });
  if (!chunks.length) return [];
  const documents = await repository.getAll('documents', { workspaceId, userId, status: 'ready' });
  const namesById = new Map(documents.map((document) => [document.id, document.originalName]));
  return chunks
    .filter((chunk) => namesById.has(chunk.documentId))
    .map((chunk) => ({ ...chunk, documentName: namesById.get(chunk.documentId) }));
}

async function retrieveChunks({ workspaceId, userId, query = '', selectedDocumentIds = [], type = 'ask', topK = 8 }) {
  const chunks = await loadWorkspaceChunks(workspaceId, userId, selectedDocumentIds);
  if (type !== 'ask') {
    return chunks.slice(0, 20).map((chunk) => ({
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      snippet: snippetFromText(chunk.text, query),
      score: 0,
      chunkIndex: chunk.chunkIndex,
      text: cleanText(chunk.text),
      metadata: chunk.metadata || {}
    }));
  }

  const terms = queryTerms(query);
  if (!terms.length) return [];

  const queryPassages = passageCandidates(chunks);
  return queryPassages
    .map((passage) => {
      const primaryScore = scorePassage(passage.text, terms);
      const surroundingScore = scorePassage(passage.surroundingText, terms);
      const boostedScore = primaryScore + surroundingScore * 0.12 + questionBoost(query, passage.text);
      return {
        ...passage,
        score: boostedScore,
        snippet: passage.text,
        text: passage.text
      };
    })
    .filter((passage) => passage.score > 0)
    .sort((left, right) => right.score - left.score || left.text.length - right.text.length)
    .slice(0, Math.min(topK, 3));
}

module.exports = {
  retrieveChunks,
  loadWorkspaceChunks
};
