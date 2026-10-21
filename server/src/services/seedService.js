const bcrypt = require('bcryptjs');
const repository = require('./repository');
const { chunkText } = require('../utils/chunking');
const seedWorkspaces = require('../data/seedWorkspaces');
const seedDocuments = require('../data/seedDocuments');

const demoUser = {
  name: 'NexusFlow Demo',
  email: 'demo@neuroflow.ai',
  password: 'Password@123'
};

async function seedDemoData() {
  // TODO: Create the demo user (hashed password) and its first workspace when missing,
  // TODO: upsert the seed documents, chunk them into documentChunks when none exist, and
  // TODO: add one completed demo summarize run. Return { user, workspace }.
  console.warn('seedDemoData is not implemented yet');
  return { user: null, workspace: null };
}

module.exports = {
  seedDemoData,
  demoUser
};
