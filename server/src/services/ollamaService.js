const env = require('../config/env');
const { tokenize } = require('../utils/text');
const { createHash } = require('crypto');

function fallbackVector(text = '') {
  const vector = new Array(32).fill(0);
  for (const token of tokenize(text)) {
    const hash = createHash('sha256').update(token).digest();
    const index = hash.readUInt32BE(0) % vector.length;
    vector[index] += hash[4] % 2 ? 1 : -1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
}

async function generateLocalText(prompt, options = {}) {
  try {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.ollamaChatModel,
        stream: false,
        messages: [
          ...(options.system ? [{ role: 'system', content: options.system }] : []),
          { role: 'user', content: prompt }
        ]
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return '';
    const result = await response.json();
    return result.message?.content?.trim() || '';
  } catch {
    return '';
  }
}

async function generateEmbedding(text) {
  try {
    const response = await fetch(`${env.ollamaBaseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: env.ollamaEmbedModel, prompt: text }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return fallbackVector(text);
    const result = await response.json();
    return Array.isArray(result.embedding) ? result.embedding : fallbackVector(text);
  } catch {
    return fallbackVector(text);
  }
}

module.exports = {
  generateLocalText,
  generateEmbedding,
  fallbackVector
};
