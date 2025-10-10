"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  // query,
  onSnapshot,
  // addDoc,
  // orderBy,
  arrayUnion,
  getDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";

import Sidebar from "../../components/dm/Sidebar";
import ChatWindow from "../../components/dm/ChatWindow";
import Modal from "../../components/dm/Modal";
import ChatHeader from "../../components/dm/ChatHeader";
import { User } from "@/app/types/interface";
import { Message } from "@/app/types/interface";
// import { ChatWindowProps } from "@/app/types/interface";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_PRESET_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME!;

export default function DMPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NEW: control mobile sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Messages (reading conversation doc with messages array)
  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);

    const unsubscribe = onSnapshot(convoRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMessages((data.messages as Message[]) || []);
      } else {
        setMessages([]);
      }
    });

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

  // helper to select user and close sidebar on mobile
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    // on small screens close sidebar for a focused chat view
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setIsSidebarOpen(false);
    }
  };

  // Send
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return;
    setNewMessage("");
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);

    const newMsg = {
      from: currentUser.uid,
      to: selectedUser.uid,
      text: newMessage.trim(),
      timestamp: new Date(),
    };

    const convoSnap = await getDoc(convoRef);

    if (convoSnap.exists()) {
      await updateDoc(convoRef, {
        messages: arrayUnion(newMsg),
        lastMessage: newMsg.text,
        updatedAt: newMsg.timestamp,
      });
    } else {
      await setDoc(convoRef, {
        participants: [currentUser.uid, selectedUser.uid],
        messages: [newMsg],
        lastMessage: newMsg.text,
        updatedAt: newMsg.timestamp,
      });
    }
  };

  // Image Upload in cloudinary and connecting to firebase
  useEffect(() => {
    if (image && currentUser && selectedUser) {
      const uploadAndSend = async () => {
        try {
          const imageUrl = await uploadImage(image);
          const conversationId = [currentUser.uid, selectedUser.uid]
            .sort()
            .join("_");
          const convoRef = doc(db, "dmChats", conversationId);

          const newMsg = {
            from: currentUser.uid,
            to: selectedUser.uid,
            image: imageUrl,
            timestamp: new Date(),
          };

          const convoSnap = await getDoc(convoRef);
          if (convoSnap.exists()) {
            await updateDoc(convoRef, {
              messages: arrayUnion(newMsg),
              lastMessage: "📷 Image",
              updatedAt: newMsg.timestamp,
            });
          } else {
            await setDoc(convoRef, {
              participants: [currentUser.uid, selectedUser.uid],
              messages: [newMsg],
              lastMessage: "📷 Image",
              updatedAt: newMsg.timestamp,
            });
          }

          setImage(null);
        } catch (err) {
          console.error("Upload failed:", err);
        }
      };

      uploadAndSend();
    }
  }, [image, currentUser, selectedUser]);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET_NAME);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      console.error("Cloudinary upload failed:", await response.text());
      throw new Error("Image upload failed");
    }

    const data = await response.json();
    return data.secure_url as string;
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
      {/* 🟢 Mobile overlay behind sidebar (click to close) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🧭 Sidebar */}
      <Sidebar
        users={users}
        filteredUsers={filteredUsers}
        searchTerm={searchTerm}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        onSearch={searchUser}
        onLogout={() => setIsModalOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 💬 Chat / Placeholder Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        {selectedUser ? (
          <>
            <ChatHeader
              user={selectedUser}
              onBack={() => setIsSidebarOpen(true)}
            />
            <ChatWindow
              messages={messages}
              currentUser={currentUser!}
              newMessage={newMessage}
              setImage={setImage}
              setNewMessage={setNewMessage}
              onSendMessage={sendMessage}
              messagesEndRef={messagesEndRef}
            />
          </>
        ) : (
          // ✅ Default placeholder when no chat selected
          <div className="flex flex-col items-center justify-center h-full text-gray-600 px-4 text-center w-full">
            <h2 className="text-lg font-semibold mb-2">
              Select a chat to start messaging
            </h2>
            <p className="text-sm text-gray-400">
              Open your sidebar to choose a user.
            </p>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="sm:hidden mt-4 bg-blue-500 text-white px-4 py-2 rounded-full"
            >
              Open Chats
            </button>
          </div>
        )}
      </div>

      {/* 🚪 Logout Modal */}
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
