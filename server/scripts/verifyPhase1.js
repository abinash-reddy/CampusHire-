const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const models = require('../../server/models');

async function testPhase1() {
  console.log('Testing Phase 1: MongoDB & 14 Mongoose Models Verification...');
  console.log(`URI in env: ${process.env.MONGODB_URI || process.env.MONGO_URI}`);

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campushire';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Connected to MongoDB successfully!');

  const modelNames = [
    'User',
    'Student',
    'Company',
    'RecruitmentDrive',
    'Application',
    'Resume',
    'ResumeTest',
    'ResumeVersion',
    'Interview',
    'Notification',
    'PlacementUpdate',
    'Result',
    'AIConversation',
    'AIAnalysis',
  ];

  let missing = 0;
  for (const name of modelNames) {
    if (models[name] && typeof models[name].find === 'function') {
      const count = await models[name].countDocuments();
      console.log(`  ✅ Model [${name}] loaded & verified (collection has ${count} docs)`);
    } else {
      console.error(`  ❌ Model [${name}] is missing or invalid!`);
      missing++;
    }
  }

  if (missing === 0) {
    console.log('\n🎉 ALL 14 PHASE 1 MONGOOSE MODELS VERIFIED SUCCESSFULLY!');
  } else {
    console.error(`\n❌ Failed: ${missing} models missing.`);
    process.exit(1);
  }

  await mongoose.disconnect();
}

testPhase1().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
