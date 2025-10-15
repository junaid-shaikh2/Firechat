"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FirebaseError } from "firebase/app"; // Import FirebaseError if necessary

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  // 🔹 Google Sign-in
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || user.email?.split("@")[0],
            email: user.email,
          });
        }

        router.push("/chat/dm");
      }
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      let message = "Failed to sign in with Google.";

      if (error instanceof Error) {
        if (error.message === "auth/popup-closed-by-user") {
          message = "Sign-in popup was closed before completing.";
        } else if (error.message === "auth/cancelled-popup-request") {
          message = "Another popup is already open. Please try again.";
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Email/Password Auth (Login or Signup)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name,
          email: user.email,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.push("/chat/dm");
    } catch (error: unknown) {
      console.error("Authentication error:", error);

      let message = "Something went wrong. Please try again.";

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/invalid-email":
            message = "Invalid email address.";
            break;
          case "auth/missing-password":
            message = "Please enter your password.";
            break;
          case "auth/weak-password":
            message = "Password must be at least 6 characters long.";
            break;
          case "auth/email-already-in-use":
            message = "An account with this email already exists.";
            break;
          case "auth/user-not-found":
            message = "No user found with this email.";
            break;
          case "auth/wrong-password":
          case "auth/invalid-credential":
            message = "Incorrect email or password.";
            break;
          default:
            message = error.message || message;
        }
      } else if (error instanceof Error) {
        message = error.message || message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] relative overflow-hidden px-4">
      <div className="relative z-10 bg-white p-6 sm:p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] w-full max-w-sm border border-gray-100 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)]">
        {/* Apple-style top dots */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full bg-[#1c1c1c]" />
          <span className="w-3 h-3 rounded-full bg-[#3a3a3a]" />
          <span className="w-3 h-3 rounded-full bg-[#5a5a5a]" />
        </div>

        <h1 className="text-center font-semibold text-gray-800 text-2xl sm:text-3xl mb-1 tracking-tight">
          FireChat
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm sm:text-base">
          {isSignup ? "Create your account" : "Login to continue"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignup && (
            <div className="relative">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=" "
                required
                className="peer w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-black focus:outline-none focus:border-gray-600 transition-all"
              />
              <label
                htmlFor="name"
                className="absolute left-3 top-2.5 bg-white px-1 text-gray-500 transition-all duration-200
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                peer-focus:-top-2 peer-focus:text-sm peer-valid:-top-2 peer-valid:text-sm"
              >
                Name
              </label>
            </div>
          )}

          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
              className="peer w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-black focus:outline-none focus:border-gray-600 transition-all"
            />
            <label
              htmlFor="email"
              className="absolute left-3 top-2.5 bg-white px-1 text-gray-500 transition-all duration-200
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
              peer-focus:-top-2 peer-focus:text-sm peer-valid:-top-2 peer-valid:text-sm"
            >
              Email
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-black focus:outline-none focus:border-gray-600 transition-all pr-10"
            />
            <label
              htmlFor="password"
              className="absolute left-3 top-2.5 bg-white px-1 text-gray-500 transition-all duration-200
              peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
              peer-focus:-top-2 peer-focus:text-sm peer-valid:-top-2 peer-valid:text-sm"
            >
              Password
            </label>

            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg"
              >
                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl cursor-pointer text-white font-medium transition-transform duration-200
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800 hover:scale-[1.02]"}`}
          >
            {loading ? "Loading..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6">
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-2 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google sign-in button */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full py-2.5 cursor-pointer rounded-xl bg-white border border-gray-300 text-black font-medium hover:bg-gray-100 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Loading..."
            ) : (
              <>
                <div
                  className="cursor-pointer"
                  onClick={signInWithGoogle}
                ></div>
                <Image
                  src="/google-logo.png"
                  alt="Google Logo"
                  width={20}
                  height={20}
                />
                Sign in with Google
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-4 text-center text-red-600 text-sm">{error}</p>
        )}

        <p className="mt-4 text-center text-gray-500 text-sm">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 cursor-pointer"
          >
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}
