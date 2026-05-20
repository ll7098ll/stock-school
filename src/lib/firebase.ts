import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8nIDlmXp776SmHA4y1_osUwRYXhUb4ww",
  authDomain: "stock-87501.firebaseapp.com",
  projectId: "stock-87501",
  storageBucket: "stock-87501.firebasestorage.app",
  messagingSenderId: "392094879777",
  appId: "1:392094879777:web:cca72a2827b0b681c59360"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
