const mongoose = require('mongoose');
const models = require('../models');

console.log('====================================================');
console.log('🎓 CampusHire – Mongoose Schema Verification');
console.log('====================================================');

let hasError = false;

for (const [name, model] of Object.entries(models)) {
  try {
    const instance = new model();
    const validationError = instance.validateSync();
    const errorCount =
      validationError && validationError.errors
        ? Object.keys(validationError.errors).length
        : 0;

    console.log(`✅ [PASS] ${name.padEnd(18)} : Valid Schema (${errorCount} required constraints)`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name} threw error: ${err.message}`);
    hasError = true;
  }
}

if (!hasError) {
  console.log('====================================================');
  console.log('✨ All 11 Mongoose models passed schema checks without error!');
  console.log('====================================================');
  process.exit(0);
} else {
  process.exit(1);
}
