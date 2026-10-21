const mongoose = require('mongoose');
const env = require('./env');

const dbState = {
  mode: 'memory',
  connected: false,
  error: null
};

async function connectDatabase() {
  if (!env.mongodbUri) {
    dbState.mode = 'memory';
    dbState.connected = false;
    dbState.error = null;
    console.warn('MONGODB_URI is not configured; using in-memory storage. Data will not persist across server restarts.');
    return dbState;
  }

  try {
    await mongoose.connect(env.mongodbUri, { autoIndex: true });
    dbState.mode = 'mongo';
    dbState.connected = true;
    dbState.error = null;
  } catch (error) {
    dbState.mode = 'memory';
    dbState.connected = false;
    dbState.error = error.message;
    console.error('MongoDB connection failed; falling back to in-memory storage.', error);
  }
  return dbState;
}

module.exports = {
  dbState,
  connectDatabase
};
