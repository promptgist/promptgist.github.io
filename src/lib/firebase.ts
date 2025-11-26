import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCfnVXccDAzfboO9azKqU9FwSLTE1hscYw",
  authDomain: "promptgist-70f1d.firebaseapp.com",
  projectId: "promptgist-70f1d",
  storageBucket: "promptgist-70f1d.firebasestorage.app",
  messagingSenderId: "122775237430",
  appId: "1:122775237430:web:378d55c2ed5c065302b997",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
