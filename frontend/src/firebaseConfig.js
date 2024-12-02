// Import necessary Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDQeAL4fCTgjOipAoppMHS8v4ukJX7bvUM",
    authDomain: "smocam-3b5d2.firebaseapp.com",
    projectId: "smocam-3b5d2",
    storageBucket: "smocam-3b5d2.firebasestorage.app",
    messagingSenderId: "31978483315",
    appId: "1:31978483315:web:e0790792b052ff094d8406",
    measurementId: "G-KXKB1Z3YPB"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firebase Authentication
export const auth = getAuth(app);