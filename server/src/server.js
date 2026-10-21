const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/db');
const { seedDemoData } = require('./services/seedService');

async function start() {
  await connectDatabase();
  if (env.seedSampleData) {
    await seedDemoData();
  }
  app.listen(env.port, () => {
    console.log(`NexusFlow API running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
