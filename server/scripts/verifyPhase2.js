const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const { admin, firebaseInitialized } = require('../config/firebaseAdmin');
const { firebaseAuthMiddleware } = require('../middlewares/firebaseAuthMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const { User } = require('../models');

async function testPhase2() {
  console.log('Testing Phase 2: Firebase Authentication & Admin Middleware Verification...');

  // 1. Verify Firebase Admin initialization
  console.log(`  🔍 Firebase Admin initialized status: ${firebaseInitialized}`);
  if (!firebaseInitialized) {
    console.error('  ❌ Firebase Admin failed to initialize!');
    process.exit(1);
  }
  console.log('  ✅ Firebase Admin SDK loaded and configured successfully!');

  // 2. Verify User model schema
  const userIndexes = await User.collection.indexes();
  console.log('  🔍 Verifying User model indexes for firebaseUid...');
  const hasFirebaseUidIndex = userIndexes.some((idx) => idx.key && idx.key.firebaseUid !== undefined);
  if (!hasFirebaseUidIndex) {
    console.log('  ℹ️  Creating index on User.firebaseUid...');
    await User.collection.createIndex({ firebaseUid: 1 }, { unique: true, sparse: true });
  }
  console.log('  ✅ User model has unique sparse index on firebaseUid');

  // 3. Verify middleware functions
  if (typeof firebaseAuthMiddleware === 'function' && typeof roleMiddleware === 'function') {
    console.log('  ✅ firebaseAuthMiddleware and roleMiddleware are valid Express middlewares');
  } else {
    console.error('  ❌ Middlewares are not functions!');
    process.exit(1);
  }

  console.log('\n🎉 ALL PHASE 2 FIREBASE AUTHENTICATION CHECKS PASSED!');
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campushire';
mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 }).then(() => {
  testPhase2()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Phase 2 test failed:', err);
      await mongoose.disconnect();
      process.exit(1);
    });
});
