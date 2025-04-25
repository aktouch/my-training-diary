import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // 追加

const firebaseConfig = {
  apiKey: "AIzaSyCY_xkUwk1I5xMSRzls4zFQcVOl12M4fwM",
  authDomain: "training-diary-ff083.firebaseapp.com",
  projectId: "training-diary-ff083",
  storageBucket: "training-diary-ff083.firebasestorage.app",
  messagingSenderId: "771917492198",
  appId: "1:771917492198:web:1abab0d8161d0ad2797027"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 追加
export const provider = new GoogleAuthProvider(); // 追加
