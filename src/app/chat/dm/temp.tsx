// {
//   /* <svg
//   className="w-5 h-5"
//   viewBox="0 0 533.5 544.3"
//   xmlns="http://www.w3.org/2000/svg"
//   aria-hidden
// >
//   <path
//     fill="#4285F4"
//     d="M533.5 278.4c0-18.3-1.6-36-4.6-53.1H272v100.6h147.2c-6.3 33.9-25.6 62.6-54.7 81.8v67h88.4c51.8-47.7 81.6-118 81.6-196.3z"
//   />
//   <path
//     fill="#34A853"
//     d="M272 544.3c73.5 0 135.3-24.4 180.4-66.4l-88.4-67c-24.6 16.5-56 26.4-92 26.4-70.7 0-130.6-47.8-152-112.1H32.3v70.5C77.1 488 168.4 544.3 272 544.3z"
//   />
//   <path
//     fill="#FBBC05"
//     d="M119.9 321.3c-10.8-32.1-10.8-66.8 0-98.9V152h-87.6C6.8 198.5 0 234.8 0 272s6.8 73.5 32.3 120.2l87.6-70.9z"
//   />
//   <path
//     fill="#EA4335"
//     d="M272 108.6c39.8 0 75.8 13.7 104.1 40.5l78-78C403 24.9 335.4 0 272 0 168.4 0 77.1 56.3 32.3 152l87.6 70.4C141.4 156.4 201.3 108.6 272 108.6z"
//   />
// </svg>; */
// }

// "use client";

// import { useState, useEffect } from "react";
// import { auth, db } from "../../lib/firebase";
// import {
//   collection,
//   query,
//   where,
//   onSnapshot,
//   addDoc,
//   doc,
//   getDocs,
//   orderBy,
//   setDoc,
//   getDoc,
// } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";

// export default function DMPage() {
//   const [currentUser, setCurrentUser] = useState<any>(null);
//   const [users, setUsers] = useState<any[]>([]);
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [messages, setMessages] = useState<any[]>([]);
//   const [newMessage, setNewMessage] = useState("");

//   // ✅ Watch auth
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) setCurrentUser(user);
//     });
//     return () => unsubscribe();
//   }, []);

//   // ✅ Fetch all users
//   useEffect(() => {
//     if (!currentUser) return;
//     const q = query(
//       collection(db, "users"),
//       where("uid", "!=", currentUser.uid)
//     );
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       setUsers(snapshot.docs.map((doc) => doc.data()));
//     });
//     return () => unsubscribe();
//   }, [currentUser]);

//   // ✅ Generate conversationId
//   const getConversationId = (uid1: string, uid2: string) => {
//     return [uid1, uid2].sort().join("_");
//   };

//   // ✅ Load messages for selected user
//   useEffect(() => {
//     if (!currentUser || !selectedUser) return;

//     const conversationId = getConversationId(currentUser.uid, selectedUser.uid);
//     const msgsRef = collection(db, "dmChats", conversationId, "messages");
//     const q = query(msgsRef, orderBy("timestamp", "asc"));

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
//     });

//     return () => unsubscribe();
//   }, [currentUser, selectedUser]);

//   // ✅ Send a message
//   const sendMessage = async () => {
//     if (!newMessage.trim() || !currentUser || !selectedUser) return;

//     const conversationId = getConversationId(currentUser.uid, selectedUser.uid);
//     const msgsRef = collection(db, "dmChats", conversationId, "messages");

//     await addDoc(msgsRef, {
//       from: currentUser.uid,
//       to: selectedUser.uid,
//       text: newMessage,
//       timestamp: new Date(),
//     });

//     setNewMessage("");
//   };

//   return (
//     <div className="flex min-h-screen">
//       {/* Sidebar - Users */}
//       <div className="w-1/4 border-r p-4">
//         <h2 className="font-bold mb-2">Users</h2>
//         {users.map((u) => (
//           <div
//             key={u.uid}
//             className={`p-2 cursor-pointer rounded text-gray-400 ${
//               selectedUser?.uid === u.uid ? "bg-gray-700" : "hover:bg-gray-600"
//             }`}
//             onClick={() => setSelectedUser(u)}
//           >
//             {u.name || u.email}
//           </div>
//         ))}
//       </div>

//       {/* Chat Window */}
//       <div className="flex-1 flex flex-col">
//         {selectedUser ? (
//           <>
//             <div className="p-4 border-b font-bold">
//               Chat with {selectedUser.name || selectedUser.email}
//             </div>
//             <div className="flex-1 p-4 overflow-y-auto">
//               {messages.map((msg) => (
//                 <div
//                   key={msg.id}
//                   className={`mb-2 ${
//                     msg.from === currentUser.uid ? "text-right" : "text-left"
//                   }`}
//                 >
//                   <span
//                     className={`inline-block px-3 py-2 rounded-lg ${
//                       msg.from === currentUser.uid
//                         ? "bg-blue-500 text-white"
//                         : "bg-gray-200 text-black"
//                     }`}
//                   >
//                     {msg.text}
//                   </span>
//                 </div>
//               ))}
//             </div>
//             <div className="p-4 border-t flex gap-2">
//               <input
//                 type="text"
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 border rounded px-3 py-2"
//               />
//               <button
//                 onClick={sendMessage}
//                 className="bg-blue-500 text-white px-4 rounded"
//               >
//                 Send
//               </button>
//             </div>
//           </>
//         ) : (
//           <div className="flex items-center justify-center flex-1">
//             Select a user to start chatting
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
