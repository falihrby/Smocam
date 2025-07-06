// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQeAL4fCTgjOipAoppMHS8v4ukJX7bvUM",
  authDomain: "smocam-3b5d2.firebaseapp.com",
  projectId: "smocam-3b5d2",
  storageBucket: "smocam-3b5d2.appspot.com",
  messagingSenderId: "31978483315",
  appId: "1:31978483315:web:e0790792b052ff094d8406",
  measurementId: "G-KXKB1Z3YPB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore database and Firebase Authentication
export const db = getFirestore(app);
export const auth = getAuth(app);
