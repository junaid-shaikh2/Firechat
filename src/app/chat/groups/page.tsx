// "use client";

// import { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import { auth, db } from "../../lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import {
//   collection,
//   query,
//   onSnapshot,
//   addDoc,
//   orderBy,
//   doc,
//   getDoc,
//   updateDoc,
//   deleteDoc,
// } from "firebase/firestore";

// interface User {
//   uid: string;
//   name?: string;
//   email?: string;
// }

// interface Group {
//   id: string;
//   name: string;
//   members: string[];
//   createdBy: string;
// }

// interface Message {
//   id?: string;
//   from: string;
//   fromName?: string;
//   text: string;
//   timestamp: any;
// }

// export default function GroupsPage() {
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [groups, setGroups] = useState<Group[]>([]);
//   const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [newGroupName, setNewGroupName] = useState("");
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // ✅ Auth listener
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setCurrentUser({
//           uid: user.uid,
//           email: user.email!,
//           name: user.displayName || user.email?.split("@")[0],
//         });
//       }
//     });
//     return () => unsub();
//   }, []);

//   // ✅ Fetch groups user is part of
//   useEffect(() => {
//     if (!currentUser) return;
//     const q = query(collection(db, "groups"));

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const allGroups: Group[] = snapshot.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }) as Group)
//         .filter((g) => g.members?.includes(currentUser.uid));
//       setGroups(allGroups);
//     });

//     return () => unsubscribe();
//   }, [currentUser]);

//   // ✅ Fetch group messages
//   useEffect(() => {
//     if (!selectedGroup) return;
//     const msgsRef = collection(db, "groups", selectedGroup.id, "messages");
//     const q = query(msgsRef, orderBy("timestamp", "asc"));

//     const unsubscribe = onSnapshot(q, async (snapshot) => {
//       const msgs = await Promise.all(
//         snapshot.docs.map(async (docSnap) => {
//           const data = docSnap.data();
//           let senderName = "Unknown";
//           try {
//             const userDoc = await getDoc(doc(db, "users", data.from));
//             if (userDoc.exists()) {
//               senderName =
//                 userDoc.data().name || userDoc.data().email || "Unknown";
//             }
//           } catch {}
//           return { id: docSnap.id, fromName: senderName, ...data } as Message;
//         })
//       );
//       setMessages(msgs);
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     });

//     return () => unsubscribe();
//   }, [selectedGroup]);

//   // ✅ Send message
//   const sendMessage = async () => {
//     if (!newMessage.trim() || !currentUser || !selectedGroup) return;
//     const msgsRef = collection(db, "groups", selectedGroup.id, "messages");
//     await addDoc(msgsRef, {
//       from: currentUser.uid,
//       text: newMessage.trim(),
//       timestamp: new Date(),
//     });
//     setNewMessage("");
//   };

//   // ✅ Create group
//   const createGroup = async () => {
//     if (!newGroupName.trim() || !currentUser) return;
//     await addDoc(collection(db, "groups"), {
//       name: newGroupName.trim(),
//       members: [currentUser.uid],
//       createdBy: currentUser.uid,
//     });
//     setNewGroupName("");
//     setShowCreateModal(false);
//   };

//   // ✅ Exit group
//   const exitGroup = async (groupId: string) => {
//     if (!currentUser) return;
//     const groupRef = doc(db, "groups", groupId);
//     const groupSnap = await getDoc(groupRef);
//     if (!groupSnap.exists()) return;

//     const groupData = groupSnap.data();
//     const updatedMembers = groupData.members.filter(
//       (m: string) => m !== currentUser.uid
//     );

//     await updateDoc(groupRef, { members: updatedMembers });
//     setSelectedGroup(null);
//   };

//   // ✅ Delete group (only by creator)
//   const deleteGroup = async (groupId: string) => {
//     if (!currentUser) return;
//     const groupRef = doc(db, "groups", groupId);
//     const groupSnap = await getDoc(groupRef);
//     if (!groupSnap.exists()) return;

//     if (groupSnap.data().createdBy !== currentUser.uid) {
//       alert("Only the creator can delete this group.");
//       return;
//     }

//     await deleteDoc(groupRef);
//     setSelectedGroup(null);
//   };

//   // ✅ Logout
//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       setCurrentUser(null);
//       setSelectedGroup(null);
//       setMessages([]);
//       window.location.href = "/";
//     } catch (err) {
//       console.error("Logout Error:", err);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-[#E5E5EA]">
//       {/* Sidebar */}
//       <div className="w-1/4 border-r p-4 bg-white flex flex-col justify-between h-screen">
//         <div>
//           <div className="flex justify-between items-center mb-3">
//             <h2 className="font-semibold text-gray-800 text-lg">Groups</h2>
//             <button
//               onClick={() => setShowCreateModal(true)}
//               className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center"
//             >
//               +
//             </button>
//           </div>

//           <div className="space-y-1">
//             {groups.length === 0 ? (
//               <p className="text-gray-500 text-sm">No groups joined yet</p>
//             ) : (
//               groups.map((group) => (
//                 <div
//                   key={group.id}
//                   className={`p-2 rounded-xl cursor-pointer text-sm transition ${
//                     selectedGroup?.id === group.id
//                       ? "bg-blue-500 text-white"
//                       : "hover:bg-gray-100 text-gray-800"
//                   }`}
//                   onClick={() => setSelectedGroup(group)}
//                 >
//                   {group.name}
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         <div className="mt-4 flex flex-col gap-2">
//           <Link
//             href="/chat/dm"
//             className="block text-center bg-gray-200 hover:bg-gray-300 text-black rounded-full py-2 text-sm"
//           >
//             💬 Direct Messages
//           </Link>
//           <button
//             onClick={handleLogout}
//             className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-full text-sm"
//           >
//             Logout
//           </button>
//         </div>
//       </div>

//       {/* Chat Window */}
//       {selectedGroup ? (
//         <div className="flex-1 flex flex-col h-screen bg-[#E5E5EA]">
//           {/* Header */}
//           <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm">
//             <div className="flex items-center gap-3">
//               <img
//                 src={`https://ui-avatars.com/api/?name=${selectedGroup.name}&background=random&color=fff&size=64`}
//                 alt="Group"
//                 className="w-10 h-10 rounded-full"
//               />
//               <span className="font-semibold text-gray-800 text-lg">
//                 {selectedGroup.name}
//               </span>
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={() => exitGroup(selectedGroup.id)}
//                 className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full px-3 py-1 text-xs"
//               >
//                 Exit
//               </button>
//               <button
//                 onClick={() => deleteGroup(selectedGroup.id)}
//                 className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 py-1 text-xs"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>

//           {/* Messages */}
//           <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
//             {messages.map((msg) => {
//               const isOwn = msg.from === currentUser?.uid;
//               return (
//                 <div
//                   key={msg.id}
//                   className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-md transition-all duration-200 ${
//                       isOwn
//                         ? "bg-blue-500 text-white rounded-br-none"
//                         : "bg-white text-gray-800 rounded-bl-none"
//                     }`}
//                   >
//                     {!isOwn && (
//                       <p className="text-xs text-gray-500 mb-1">
//                         {msg.fromName}
//                       </p>
//                     )}
//                     {msg.text}
//                   </div>
//                 </div>
//               );
//             })}
//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input */}
//           <div className="p-3 border-t bg-white">
//             <div className="relative w-full">
//               <input
//                 type="text"
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 placeholder="Message"
//                 className="w-full bg-gray-100 rounded-full px-4 py-3 pr-12 text-gray-800 focus:outline-none"
//                 onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//               />
//               <button
//                 onClick={sendMessage}
//                 disabled={!newMessage.trim()}
//                 className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold shadow"
//               >
//                 ↑
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="flex-1 flex items-center justify-center text-gray-600">
//           Select a group to start chatting 👥
//         </div>
//       )}

//       {/* ✅ Create Group Modal */}
//       {showCreateModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white p-6 rounded-2xl shadow-lg w-80">
//             <h3 className="text-lg font-semibold mb-4 text-gray-800">
//               Create New Group
//             </h3>
//             <input
//               type="text"
//               placeholder="Group name"
//               value={newGroupName}
//               onChange={(e) => setNewGroupName(e.target.value)}
//               className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//             />
//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCreateModal(false)}
//                 className="bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2 text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createGroup}
//                 className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
//               >
//                 Create
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// src/app/chat/groups/page.tsx

export default function GroupsPage() {
  return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      Group Chat feature coming soon...
    </div>
  );
}
