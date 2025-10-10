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

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error) {
      console.error("Authentication error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-center font-bold text-gray-800 sm:text-3xl text-xl mb-2">
          FireChat 💬
        </h1>
        <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
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
                className="peer w-full rounded-lg border border-gray-300 bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-black focus:outline-none transition-all"
              />
              <label
                htmlFor="name"
                className="absolute left-2 sm:left-3 top-2 sm:top-3 bg-white px-1 text-gray-500 transition-all duration-200
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
              className="peer w-full rounded-lg border border-gray-300 bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-black focus:outline-none transition-all"
            />
            <label
              htmlFor="email"
              className="absolute left-2 sm:left-3 top-2 sm:top-3 bg-white px-1 text-gray-500 transition-all duration-200
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                peer-focus:-top-2 peer-focus:text-sm peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-sm"
            >
              Email
            </label>
          </div>

          {/* PASSWORD FIELD WITH EYE ICON */}
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full rounded-lg border border-gray-300 bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-black focus:outline-none transition-all pr-10"
            />
            <label
              htmlFor="password"
              className="absolute left-2 sm:left-3 top-2 sm:top-3 bg-white px-1 text-gray-500 transition-all duration-200
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                peer-focus:-top-2 peer-focus:text-sm peer-valid:-top-2 peer-valid:text-sm"
            >
              Password
            </label>

            {/* Show eye only when password has value */}
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg"
              >
                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
              </button>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 sm:py-3 rounded-lg text-white font-semibold transition
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : isSignup ? (
                "Sign Up"
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-2 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 py-2 sm:py-3 transition"
          >
            <Image
              src="/google-logo.png"
              alt="Google Logo"
              className="w-5 sm:w-6 h-5 sm:h-6"
              width={24}
              height={24}
            />
            <span className="text-gray-700 font-medium text-sm sm:text-base">
              Continue with Google
            </span>
          </button>
        </div>

        <p className="text-center text-gray-500 text-[12px] sm:text-[13px] mt-5">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="font-medium text-gray-800 hover:text-black hover:underline-offset-4 hover:underline transition-all duration-200 text-sm sm:text-base"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>

        {error && (
          <p className="text-red-500 text-sm text-center mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
