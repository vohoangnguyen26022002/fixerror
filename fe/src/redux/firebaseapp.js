// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDq0WDzqEm9Mx4RoF8x8Sjw9UUBdzluLns",
  authDomain: "testlocal-6f7bf.firebaseapp.com",
  databaseURL:
    "https://testlocal-6f7bf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "testlocal-6f7bf",
  storageBucket: "testlocal-6f7bf.firebasestorage.app",
  messagingSenderId: "239556991471",
  appId: "1:239556991471:web:d67553a5355d3531997e1a",
  measurementId: "G-P67H1EH94X",
};

// Khởi tạo Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const realtimeDb = getDatabase(firebaseApp);
export { firebaseApp, auth, db, realtimeDb };
