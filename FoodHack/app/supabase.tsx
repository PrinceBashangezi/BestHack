import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore"; // Import Firestore methods
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage for local persistence

const firebaseConfig = {
  apiKey: "AIzaSyCnlOhD-SSVmtrflFjO7eWM0K2auOWUHUw",
  authDomain: "foodhack-b663f.firebaseapp.com",
  projectId: "foodhack-b663f",
  storageBucket: "foodhack-b663f.firebasestorage.app",
  messagingSenderId: "869071555125",
  appId: "1:869071555125:web:ff88781e41cdac1e477f7c",
  measurementId: "G-7BYWM44HSV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Auth with local persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage) // Use AsyncStorage for local persistence
});

// Initialize Firestore
const firestore: Firestore = getFirestore(app);

export { auth, firestore};