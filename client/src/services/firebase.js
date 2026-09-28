import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

/**
 * CampusHire Firebase Client Configuration
 * Integrated for secure client-side authentication and ID token issuance
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAS9DQikNN2u7cZAmeKs7D2DGGNmcTAc78',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'campushire-f3d0a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'campushire-f3d0a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'campushire-f3d0a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '992914702166',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:992914702166:web:ea75a50efb31ca63f860f7',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NE4C8RWE7T',
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Firebase Auth Helper Functions
 */
export const loginWithFirebaseEmail = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
};

export const registerWithFirebaseEmail = async (email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
};

export const loginWithFirebaseGoogle = async () => {
  const credential = await signInWithPopup(auth, googleProvider);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
};

export const sendFirebasePasswordReset = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

export const logoutFirebase = async () => {
  return await signOut(auth);
};

export default app;
