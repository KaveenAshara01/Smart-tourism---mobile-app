// config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAuDW_t2BOj07vVkEF6MNGiMgiI0dPBVS0",
    authDomain: "smarttourism-c4342.firebaseapp.com",
    projectId: "smarttourism-c4342",
    storageBucket: "smarttourism-c4342.firebasestorage.app",
    messagingSenderId: "964973283700",
    appId: "1:964973283700:web:f9e14e26d7c41979444421"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth (persistence is automatic in Expo)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };