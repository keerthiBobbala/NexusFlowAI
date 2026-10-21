const { randomUUID } = require('crypto');

function createBucket() {
  return new Map();
}

const store = {
  users: createBucket(),
  workspaces: createBucket(),
  documents: createBucket(),
  documentChunks: createBucket(),
  chatThreads: createBucket(),
  chatMessages: createBucket(),
  workflowRuns: createBucket()
};

function reset() {
  Object.values(store).forEach((bucket) => bucket.clear());
}

function clone(value) {
  // Deep copy to avoid external mutation
  return JSON.parse(JSON.stringify(value));
}

function list(collection) {
  const bucket = store[collection];
  if (!bucket) return [];
  return Array.from(bucket.values()).map(clone);
}

function get(collection, id) {
  const bucket = store[collection];
  if (!bucket) return null;
  const record = bucket.get(id);
  return record ? clone(record) : null;
}

function set(collection, value) {
  const bucket = store[collection];
  if (!bucket) throw new Error(`Unknown collection ${collection}`);
  const id = randomUUID();
  const now = new Date();
  const record = { id, createdAt: now, updatedAt: now, ...value };
  bucket.set(id, record);
  return clone(record);
}

function patch(collection, id, updates) {
  const bucket = store[collection];
  if (!bucket) throw new Error(`Unknown collection ${collection}`);
  const existing = bucket.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date() };
  bucket.set(id, updated);
  return clone(updated);
}

function remove(collection, id) {
  const bucket = store[collection];
  if (!bucket) throw new Error(`Unknown collection ${collection}`);
  const record = bucket.get(id);
  if (!record) return null;
  bucket.delete(id);
  return clone(record);
}

function removeWhere(collection, predicate) {
  const bucket = store[collection];
  if (!bucket) throw new Error(`Unknown collection ${collection}`);
  const removed = [];
  for (const [id, rec] of bucket.entries()) {
    if (predicate(rec)) {
      bucket.delete(id);
      removed.push(clone(rec));
    }
  }
  return removed;
}

module.exports = {
  store,
  reset,
  list,
  get,
  set,
  patch,
  remove,
  removeWhere
};
