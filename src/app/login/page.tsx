// component for authentication in firebase (for the todo app) in this nextjs app

"use client";

import React from "react";
import { useState, useEffect } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "../lib/firebase";
import { initializeApp } from "firebase/app";
import { getDoc, getDocs, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import page from "../chat/dm/page";
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

          <span className="text-sm font-medium">Sign in with Google</span>
        </button>

        {/* dm page */}
        {/* Example: Render something if user is authenticated */}
        {name && email && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Welcome, {name}!
            </h2>
            <p className="text-sm text-gray-600">{email}</p>
            <Page />
          </div>
        )}

        {/* User Info Card */}
        {/* {name && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full max-w-sm text-center">
            <img
            // src={photoUrl ?? undefined}
            // alt="Profile"
            // className="w-20 h-20 rounded-full mx-auto mb-4 shadow"
            />
            <h1 className="text-lg font-semibold text-gray-800">{name}</h1>
            <p className="text-sm text-gray-600">{email}</p>
          </div>
        )} */}
      </main>
    </>
  );
};

export default Page;
