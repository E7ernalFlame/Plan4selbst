// Standard Firebase v9+ modular initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // API key is obtained from environment variable as per global security guidelines
  apiKey: process.env.API_KEY,
  authDomain: "plan4selbst.firebaseapp.com",
  projectId: "plan4selbst",
  storageBucket: "plan4selbst.firebasestorage.app",
  messagingSenderId: "111681838120",
  appId: "1:111681838120:web:6dbc77d7aeadd457cce91d"
};

// Initialize Firebase with the modular SDK syntax
// In case of type errors in certain environments, ensured the import path is standard firebase/app
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);