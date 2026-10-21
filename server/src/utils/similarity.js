const { tokenize } = require('./text');

function cosineSimilarity(left = [], right = []) {
  if (!left.length || !right.length || left.length !== right.length) return 0;
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  return leftMagnitude && rightMagnitude ? dotProduct / Math.sqrt(leftMagnitude * rightMagnitude) : 0;
}

function keywordOverlapScore(query = '', text = '') {
  const queryTokens = new Set(tokenize(query));
  const textTokens = new Set(tokenize(text));
  if (!queryTokens.size || !textTokens.size) return 0;
  let shared = 0;
  for (const token of queryTokens) if (textTokens.has(token)) shared += 1;
  return shared / Math.max(queryTokens.size, textTokens.size);
}

module.exports = {
  cosineSimilarity,
  keywordOverlapScore
};
