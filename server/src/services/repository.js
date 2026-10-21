const { dbState } = require('../config/db');
const memoryStore = require('./memoryStore');

const models = {
  users: () => require('../models/User'),
  workspaces: () => require('../models/Workspace'),
  documents: () => require('../models/Document'),
  documentChunks: () => require('../models/DocumentChunk'),
  chatThreads: () => require('../models/ChatThread'),
  chatMessages: () => require('../models/ChatMessage'),
  workflowRuns: () => require('../models/WorkflowRun')
};

function getModel(collection) {
  const loader = models[collection];
  return loader ? loader() : null;
}

function normalizeDoc(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const { __v, ...record } = plain;
  return { ...record, id: record.id || String(record._id) };
}

function matchFilter(record, filter = {}) {
  return Object.entries(filter).every(([field, expected]) => {
    const actual = record[field];
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      return Object.entries(expected).every(([operator, value]) => {
        if (operator === '$in') return value.includes(actual);
        if (operator === '$ne') return actual !== value;
        if (operator === '$exists') return value ? actual !== undefined : actual === undefined;
        return false;
      });
    }
    if (Array.isArray(expected)) return expected.includes(actual);
    return actual === expected;
  });
}

function sortResults(items, sort) {
  if (!sort) return items;
  const [field, direction] = Object.entries(sort)[0] || [];
  if (!field) return items;
  return [...items].sort((left, right) => {
    const a = left[field];
    const b = right[field];
    if (a === b) return 0;
    if (a == null) return direction < 0 ? 1 : -1;
    if (b == null) return direction < 0 ? -1 : 1;
    return (a < b ? -1 : 1) * (direction < 0 ? -1 : 1);
  });
}

// Every function below must work in both modes: the in-memory buckets while
// dbState.mode !== 'mongo', and the mapped mongoose model once connected.

async function getAll(collection, filter = {}, sort) {
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    const docs = await Model.find(filter).sort(sort).lean();
    return docs.map(normalizeDoc);
  }
  // In‑memory mode
  let items = memoryStore.list(collection);
  if (filter && Object.keys(filter).length) {
    items = items.filter((item) => matchFilter(item, filter));
  }
  if (sort) {
    items = sortResults(items, sort);
  }
  return items;
}

async function getById(collection, id) {
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    const doc = await Model.findOne({ id }).lean();
    return normalizeDoc(doc);
  }
  return memoryStore.get(collection, id);
}

async function getOne(collection, filter = {}) {
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    const doc = await Model.findOne(filter).lean();
    return normalizeDoc(doc);
  }
  const items = memoryStore.list(collection).filter((item) => matchFilter(item, filter));
  return items[0] || null;
}

async function create(collection, data) {
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    const doc = new Model(data);
    await doc.save();
    return normalizeDoc(doc);
  }
  return memoryStore.set(collection, data);
}

async function updateById(collection, id, updates) {
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    const doc = await Model.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return normalizeDoc(doc);
  }
  return memoryStore.patch(collection, id, updates);
}

async function upsert(collection, filter, createData, updateData) {
  const existing = await getOne(collection, filter);
  if (existing) return updateById(collection, existing.id, updateData);
  return create(collection, { ...filter, ...createData });
}

async function deleteById(collection, id) {
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    return normalizeDoc(await Model.findOneAndDelete({ id }).lean());
  }
  return memoryStore.remove(collection, id);
}

async function deleteWhere(collection, filter = {}) {
  const removed = await getAll(collection, filter);
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    await Model.deleteMany(filter);
    return removed;
  }
  return memoryStore.removeWhere(collection, (record) => matchFilter(record, filter));
}

async function count(collection, filter = {}) {
  if (dbState.mode === 'mongo') {
    const Model = getModel(collection);
    return Model.countDocuments(filter);
  }
  return memoryStore.list(collection).filter((record) => matchFilter(record, filter)).length;
}

module.exports = {
  getAll,
  getById,
  getOne,
  create,
  updateById,
  upsert,
  deleteById,
  deleteWhere,
  count
};
