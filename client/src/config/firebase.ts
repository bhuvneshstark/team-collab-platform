import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaqmlLrOJeC-2gFPA9IA9lq5XZcRiNUIk",
  authDomain: "team-collab-platform-5fa8f.firebaseapp.com",
  projectId: "team-collab-platform-5fa8f",
  storageBucket: "team-collab-platform-5fa8f.firebasestorage.app",
  messagingSenderId: "442401127432",
  appId: "1:442401127432:web:273157980c0b3e44cca5bd",
  measurementId: "G-6WKVPY0849"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);