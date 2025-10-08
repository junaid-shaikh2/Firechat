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

import Sidebar from "../../components/dm/Sidebar";
import ChatWindow from "../../components/dm/ChatWindow";
import Modal from "../../components/dm/Modal";
import ChatHeader from "../../components/dm/ChatHeader";
import { User } from "@/app/types/inferface";
import { Message } from "@/app/types/inferface";
// import { ChatWindowProps } from "@/app/types/inferface";
import { ChatHeaderProps } from "@/app/types/inferface";

// imorting interfaces

// interface User {
//   uid: string;
//   name?: string;
//   email?: string;
// }

// interface ChatHeaderProps {
//   user: User;
// }

// interface Message {
//   id?: string;
//   from: string;
//   to: string;
//   text: string;
//   timestamp: any;
// }

// interface ChatWindowProps {
//   name?: string | undefined;
// }

export default function DMPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth
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

  // Users
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs
        .map((doc) => doc.data() as User)
        .filter((u) => u.uid !== currentUser.uid);
      setUsers(usersList);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Messages
  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const q = query(
      collection(db, "dmChats", conversationId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) =>
      setMessages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Message)
      )
    );
    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  // Search
  const searchUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toLowerCase();
    setSearchTerm(e.target.value);
    setFilteredUsers(
      value
        ? users.filter(
            (u) =>
              u.name?.toLowerCase().includes(value) ||
              u.email?.toLowerCase().includes(value)
          )
        : []
    );
  };

  // Send
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return;
    setNewMessage("");
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const msgsRef = collection(db, "dmChats", conversationId, "messages");
    await addDoc(msgsRef, {
      from: currentUser.uid,
      to: selectedUser.uid,
      text: newMessage.trim(),
      timestamp: new Date(),
    });
  };

  // Logout
  const handleLogout = async () => {
    setIsModalOpen(false);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setSelectedUser(null);
      setMessages([]);
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#E5E5EA]">
      <Sidebar
        users={users}
        filteredUsers={filteredUsers}
        searchTerm={searchTerm}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onSearch={searchUser}
        onLogout={() => setIsModalOpen(true)}
      />

      {selectedUser ? (
        <div className="flex-1 flex flex-col h-full min-h-0">
          <ChatHeader user={selectedUser} />
          <ChatWindow
            // name={selectedUser.name}
            messages={messages}
            currentUser={currentUser!}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={sendMessage}
            messagesEndRef={messagesEndRef}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600">
          Select a user to start chatting
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
    </div>
  );
}
