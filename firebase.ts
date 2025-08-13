import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCzeZoeJHMLBt3DJ7lV3vdTzp3huxRXQyQ",
  authDomain: "class-work-515be.firebaseapp.com",
  projectId: "class-work-515be",
  storageBucket: "class-work-515be.appspot.com",
  messagingSenderId: "491708305346",
  appId: "1:491708305346:web:bc6b2fbd86d1768a0e505b",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// TODO: Initialize Cloud Firestore, Cloud Storage and get a reference to the service
export const storage = getStorage(app); //var bucket storage
export const db = getFirestore(app); // var firebase db
