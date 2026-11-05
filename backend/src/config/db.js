const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / Node.js DNS SRV resolution on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS fails
}

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jac_attendance';
  console.log(`[DB] Connecting to MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[DB] ✅ MongoDB Connected successfully to: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`\n-------------------------------------------------------------`);
    console.warn(`⚠️ [DB Notice] Could not connect to MongoDB at: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
    console.warn(`Reason: ${error.message}`);
    console.warn(`\n👉 Note for MongoDB Atlas:`);
    console.warn(`   Ensure your IP Address is whitelisted in MongoDB Atlas Network Access (set to 0.0.0.0/0 for anywhere).`);
    console.warn(`-------------------------------------------------------------\n`);
    return false;
  }
};

module.exports = connectDB;
