const mongoose = require('mongoose');

async function clearDatabase() {
  if (mongoose.connection.readyState !== 1) return;

  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false
  });

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (process.env.REQUIRE_TRANSACTION_DB !== 'false' && !hello.setName && hello.msg !== 'isdbgrid') {
    throw new Error('Test MongoDB must be a replica set or mongos so transaction tests are meaningful.');
  }
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await mongoose.disconnect();
});
