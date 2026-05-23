const mongoose = require('mongoose');
const env = require('./env');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maskMongoUri(uri) {
  return uri.replace(/\/\/([^:/?#]+):([^@/?#]+)@/, '//<user>:<password>@');
}

function isAtlasUri(uri) {
  return uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');
}

async function assertTransactionCompatible(conn) {
  if (!env.REQUIRE_TRANSACTION_DB) return;

  const hello = await conn.connection.db.admin().command({ hello: 1 });
  const isReplicaSet = Boolean(hello.setName);
  const isMongos = hello.msg === 'isdbgrid';

  if (!isReplicaSet && !isMongos) {
    throw new Error(
      [
        'MongoDB is running as a standalone server, but ASEP requires multi-document transactions.',
        'Use MongoDB Atlas M0+ or start local MongoDB as a replica set.',
        'Local URI example: mongodb://127.0.0.1:27017/skillswap?replicaSet=rs0'
      ].join(' ')
    );
  }

  console.log(`MongoDB transaction topology: ${isMongos ? 'mongos' : `replica set ${hello.setName}`}`);
}

async function connectOnce() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV === 'development',
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: env.NODE_ENV === 'production' ? 20 : 10
    });

    await assertTransactionCompatible(conn);
    return conn;
  } catch (error) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
    throw error;
  }
}

const connectDB = async () => {
  let lastError;

  for (let attempt = 1; attempt <= env.DB_CONNECT_RETRIES; attempt += 1) {
    try {
      const conn = await connectOnce();
      const topology = isAtlasUri(env.MONGODB_URI) ? 'Atlas/managed' : 'self-hosted';

      console.log(`MongoDB connected: ${conn.connection.host}`);
      console.log(`MongoDB deployment: ${topology}`);
      console.log(`MongoDB database: ${conn.connection.name}`);

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });

      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
      });

      return conn;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt}/${env.DB_CONNECT_RETRIES} failed: ${error.message}`);

      if (attempt < env.DB_CONNECT_RETRIES) {
        await wait(env.DB_CONNECT_RETRY_DELAY_MS);
      }
    }
  }

  console.error('MongoDB connection failed after retries.');
  console.error(`Configured URI: ${maskMongoUri(env.MONGODB_URI)}`);
  console.error(lastError.message);
  process.exit(1);
};

module.exports = connectDB;
