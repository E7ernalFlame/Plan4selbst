
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBRWZoTXE2WtUErAM1Zn44_tCgz42bHRBI",
  authDomain: "plan4selbst.firebaseapp.com",
  projectId: "plan4selbst",
  storageBucket: "plan4selbst.firebasestorage.app",
  messagingSenderId: "111681838120",
  appId: "1:111681838120:web:6dbc77d7aeadd457cce91d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
