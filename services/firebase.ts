
// This file connects to Google's Firebase Firestore Database.
// To enable Google Storage:
// 1. Go to console.firebase.google.com
// 2. Create a project and Add a Web App
// 3. Copy the config keys below
// 4. The app will automatically detect the keys and switch from LocalStorage to Google Cloud.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// REPLACE THESE WITH YOUR GOOGLE FIREBASE KEYS
const firebaseConfig = {
  apiKey: "", // e.g. "AIzaSy..."
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Singleton initialization
let db = null;
let isFirebaseActive = false;

// Only initialize if keys are present
if (firebaseConfig.apiKey) {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        isFirebaseActive = true;
        console.log("🔥 Google Firestore Connected");
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
} else {
    console.log("⚠️ No Google Keys found. Using Browser LocalStorage.");
}

export { db, isFirebaseActive, collection, getDocs, setDoc, doc, Timestamp };
