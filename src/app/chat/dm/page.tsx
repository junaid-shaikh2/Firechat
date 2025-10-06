"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  orderBy,
} from "firebase/firestore";

interface User {
  uid: string;
  name?: string;
  email?: string;
}

interface Message {
  id?: string;
  from: string;
  to: string;
  text: string;
  timestamp: any;
}

export default function DMPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user)
        setCurrentUser({
          uid: user.uid,
          email: user.email!,
          name: user.displayName || user.email?.split("@")[0],
        });
    });
    return () => unsubscribe();
  }, []);

  // Fetch all users except current
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList: User[] = snapshot.docs
        .map((doc) => doc.data() as User)
        .filter((u) => u.uid !== currentUser.uid);
      setUsers(usersList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Generate conversation ID
  const getConversationId = (uid1: string, uid2: string) =>
    [uid1, uid2].sort().join("_");

  // Load messages for selected user
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const conversationId = getConversationId(currentUser.uid, selectedUser.uid);
    const msgsRef = collection(db, "dmChats", conversationId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Message
      );
      setMessages(msgs);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return;

    const conversationId = getConversationId(currentUser.uid, selectedUser.uid);
    const msgsRef = collection(db, "dmChats", conversationId, "messages");

    await addDoc(msgsRef, {
      from: currentUser.uid,
      to: selectedUser.uid,
      text: newMessage.trim(),
      timestamp: new Date(),
    });

    setNewMessage("");
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setSelectedUser(null);
      setMessages([]);
      window.location.href = "/"; // redirect to login
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-300">
      {/* Sidebar */}
      <div className="w-1/4 border-r p-4 bg-white">
        <h2 className="font-bold mb-2 text-black">Users</h2>
        {users.map((user) => (
          <div
            // i want to show only the user name in the list

            key={user.uid}
            className={`p-2 text-sm cursor-pointer rounded hover:bg-gray-200 text-black truncate ${
              selectedUser?.uid === user.uid ? "bg-blue-500 text-white" : ""
            }`}
            onClick={() => setSelectedUser(user)}
          >
            {user.name || user.email}
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm"
        >
          Logout
        </button>
      </div>

      {/* Chat Window */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col h-screen bg-white">
          {/* Chat Header */}
          <div className="p-2 border-b flex items-center gap-2">
            <img
              src={`https://ui-avatars.com/api/?name=${selectedUser.name || selectedUser.email}&background=random&color=fff&size=64`}
              alt="User Icon"
              className="w-10 h-10 rounded-full"
            />
            <span className="font-bold text-black">
              {selectedUser.name || selectedUser.email}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-1 mt-1 ${msg.from === currentUser?.uid ? "text-right" : "text-left"}`}
              >
                <span
                  className={`inline-block px-3 py-2 rounded-lg ${
                    msg.from === currentUser?.uid
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t">
            <div className="relative w-full">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full border border-gray-400 rounded-full px-4 py-2 pr-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-black">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
}
