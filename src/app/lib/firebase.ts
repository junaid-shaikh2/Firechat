// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDL17PXYge3H7NvnN3Thp4h3X0qnP_SyjU",
  authDomain: "firechat-d1c82.firebaseapp.com",
  projectId: "firechat-d1c82",
  storageBucket: "firechat-d1c82.firebasestorage.app",
  messagingSenderId: "568327427367",
  appId: "1:568327427367:web:067a9940c245044c78c502"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);