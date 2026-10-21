require('dotenv').config();

const env = {
  port: process.env.PORT || 3001,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'neuroflow-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  ollamaChatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.1:8b',
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  upstashRedisUrl: process.env.UPSTASH_REDIS_URL || '',
  seedSampleData: String(process.env.SEED_SAMPLE_DATA || 'true').toLowerCase() !== 'false'
};

module.exports = env;
