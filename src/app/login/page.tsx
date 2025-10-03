// component for authentication in firebase (for the todo app) in this nextjs app

"use client";

import React from "react";
import { useState, useEffect } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { initializeApp } from "firebase/app";
import { getDoc, getDocs, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

const Page = () => {
  const [name, setName] = useState<string | null>("");
  const [email, setEmail] = useState<string | null>("");

  const provider = new GoogleAuthProvider();

  //   adding a user in firestore database if not already present

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        setName(user.displayName);
        setEmail(user.email);
        console.log(user.uid);
        console.log("hello");

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
          });
          console.log("User added to Firestore with UID:", user.uid);
        } else {
          console.log("User already exists in Firestore with UID:", user.uid);
        }
      }
    } catch (error) {
      console.log("helloq");
      console.error("Error signing in with Google:", error);
    }
  };

  //   createUserWithEmailAndPassword(auth, email, password)
  //     .then((userCredential) => {
  //       // Signed up
  //       const user = userCredential.user;
  //       console.log(user);
  //     })
  //     .catch((error) => {
  //       const errorCode = error.code;
  //       const errorMessage = error.message;
  //       console.log(errorCode, errorMessage);
  //     });

  return (
    <>
      <h1>Login or </h1>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
        {/* Google Sign-in Button */}
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 px-6 py-3 border border-gray-300 rounded-lg shadow-md bg-white hover:bg-gray-50 transition text-gray-700 font-medium"
        >
          {/* Google "G" logo */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 533.5 544.3"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              fill="#4285F4"
              d="M533.5 278.4c0-18.3-1.6-36-4.6-53.1H272v100.6h147.2c-6.3 33.9-25.6 62.6-54.7 81.8v67h88.4c51.8-47.7 81.6-118 81.6-196.3z"
            />
            <path
              fill="#34A853"
              d="M272 544.3c73.5 0 135.3-24.4 180.4-66.4l-88.4-67c-24.6 16.5-56 26.4-92 26.4-70.7 0-130.6-47.8-152-112.1H32.3v70.5C77.1 488 168.4 544.3 272 544.3z"
            />
            <path
              fill="#FBBC05"
              d="M119.9 321.3c-10.8-32.1-10.8-66.8 0-98.9V152h-87.6C6.8 198.5 0 234.8 0 272s6.8 73.5 32.3 120.2l87.6-70.9z"
            />
            <path
              fill="#EA4335"
              d="M272 108.6c39.8 0 75.8 13.7 104.1 40.5l78-78C403 24.9 335.4 0 272 0 168.4 0 77.1 56.3 32.3 152l87.6 70.4C141.4 156.4 201.3 108.6 272 108.6z"
            />
          </svg>

          <span className="text-sm font-medium">Sign in with Google</span>
        </button>

        {/* User Info Card */}
        {name && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full max-w-sm text-center">
            <img
            // src={photoUrl ?? undefined}
            // alt="Profile"
            // className="w-20 h-20 rounded-full mx-auto mb-4 shadow"
            />
            <h1 className="text-lg font-semibold text-gray-800">{name}</h1>
            <p className="text-sm text-gray-600">{email}</p>
          </div>
        )}
      </main>
    </>
  );
};

export default Page;
