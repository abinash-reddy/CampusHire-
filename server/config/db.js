const mongoose = require('mongoose');

/**
 * Connect to MongoDB database (MongoDB Atlas / MongoDB Compass / Local) via Mongoose
 */
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campushire';
    const isAtlas = mongoUri.startsWith('mongodb+srv://');

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`====================================================`);
    console.log(`🍃 [MongoDB] Connected successfully!`);
    console.log(`📡 Deployment: ${isAtlas ? 'MongoDB Atlas (Cloud Cluster)' : 'MongoDB Compass / Local Instance'}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    console.log(`====================================================`);
    return conn;
  } catch (error) {
    console.error(`====================================================`);
    console.error(`❌ [MongoDB Connection Error] Failed to connect:`);
    console.error(`   ${error.message}`);
    console.error(`💡 Check MONGODB_URI in server/.env:`);
    console.error(`   - Atlas: Whitelist 0.0.0.0/0 or your current IP in Atlas Network Access`);
    console.error(`   - Compass: Ensure local mongod is active on port 27017`);
    console.error(`====================================================`);
  }
};

module.exports = connectDB;
