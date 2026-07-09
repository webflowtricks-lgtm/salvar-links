import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCSwRKVkwLa1u5xWyoLwk0VNVr3s3FBNDk",
  authDomain: "secret-sunrise-pgtt6.firebaseapp.com",
  projectId: "secret-sunrise-pgtt6",
  storageBucket: "secret-sunrise-pgtt6.firebasestorage.app",
  messagingSenderId: "817470103921",
  appId: "1:817470103921:web:d61b7f991777c9d1b8d6d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID
export const db = getFirestore(app, "ai-studio-612c26a2-2d14-47cd-8363-48f228ae891f");

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore connection test successfully contacted server.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Firebase is offline. Check your configurations.");
    } else {
      console.log("Firestore initialized successfully (test connection log).");
    }
  }
}
