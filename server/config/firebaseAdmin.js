const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

/**
 * Firebase Admin SDK Initialization
 * Allows backend verification of Firebase ID tokens issued to students and admins.
 */
let firebaseInitialized = false;
let authInstance = null;
let firebaseApp = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'campushire-f3d0a';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle escaped newlines in environment variable
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const apps = getApps();
  if (!apps.length) {
    if (clientEmail && privateKey) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'campushire-f3d0a.firebasestorage.app',
      });
      console.log(`[Firebase Admin] Initialized with Service Account for project: ${projectId}`);
    } else {
      firebaseApp = initializeApp({
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'campushire-f3d0a.firebasestorage.app',
      });
      console.log(`[Firebase Admin] Initialized with Project ID: ${projectId} (Public verification mode)`);
    }
  } else {
    firebaseApp = apps[0];
  }

  authInstance = getAuth(firebaseApp);
  firebaseInitialized = true;
} catch (error) {
  console.warn(`[Firebase Admin Warning] Could not initialize Firebase Admin: ${error.message}`);
  firebaseInitialized = false;
}

module.exports = {
  firebaseApp,
  auth: authInstance,
  admin: {
    auth: () => authInstance,
  },
  firebaseInitialized,
};
