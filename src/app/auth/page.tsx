// "use client";

// import { useState } from "react";
// import { auth, db } from "../lib/firebase";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import { setDoc, doc } from "firebase/firestore";

// export default function AuthPage() {
//   const [isSignup, setIsSignup] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       if (isSignup) {
//         // ✅ Sign Up
//         const userCredential = await createUserWithEmailAndPassword(
//           auth,
//           email,
//           password
//         );
//         const user = userCredential.user;

//         // Save user in Firestore (for DM list)
//         await setDoc(doc(db, "users", user.uid), {
//           uid: user.uid,
//           email: user.email,
//         });
//       } else {
//         // ✅ Login
//         await signInWithEmailAndPassword(auth, email, password);
//       }
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-200">
//       <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
//         <h2 className="text-center text-xl font-bold mb-4 text-gray-800">
//           {isSignup ? "Create Account" : "Login"}
//         </h2>

//         <form onSubmit={handleAuth} className="space-y-4">
//           <input
//             type="email"
//             placeholder="Email"
//             className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />

//           {error && <p className="text-red-500 text-sm">{error}</p>}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold"
//           >
//             {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
//           </button>
//         </form>

//         <p className="text-center text-sm mt-4 text-gray-700">
//           {isSignup ? "Already have an account?" : "Don't have an account?"}
//           <button
//             onClick={() => setIsSignup(!isSignup)}
//             className="text-blue-600 ml-1 hover:underline"
//           >
//             {isSignup ? "Login" : "Sign Up"}
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// }
