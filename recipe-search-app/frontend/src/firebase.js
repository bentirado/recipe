// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnjHBBvU2yJVlqkmijDwg0SxbVgZ9CN4s",
  authDomain: "hacklahoma-7ea11.firebaseapp.com",
  projectId: "hacklahoma-7ea11",
  storageBucket: "hacklahoma-7ea11.firebasestorage.app",
  messagingSenderId: "505056782983",
  appId: "1:505056782983:web:303515f10cedb6c55c2622"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
const db = getFirestore(app); // Firestore instance

// Export Firebase Auth, Google Auth Provider, and Firestore instance
export { auth, googleProvider, db };
