import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSgnGcdDdFToLOcFeDltqQLaefhZ82zfE",
  authDomain: "fiesta-hermosa.firebaseapp.com",
  projectId: "fiesta-hermosa",
  storageBucket: "fiesta-hermosa.firebasestorage.app",
  messagingSenderId: "408730003130",
  appId: "1:408730003130:web:0baaeee846bede45930483",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
