"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { v4 as uuidv4 } from "uuid"; // add at top

import {
  collection,
  onSnapshot,
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
import { User, Message } from "@/app/types/interface";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
        .map((d) => d.data() as User)
        .filter((u) => u.uid !== currentUser.uid);
      setUsers(usersList);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Messages
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

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setIsSidebarOpen(false);
    }
    // scroll down once chat opens
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  // Send Message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !image) || !currentUser || !selectedUser) return;

    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);

    let imageUrl = null;
    if (image) {
      try {
        imageUrl = await uploadImage(image);
      } catch (err) {
        console.error("Image upload failed:", err);
        return;
      }
    }

    setNewMessage("");

    const newMsg = {
      id: uuidv4(), // ✅ assign unique message id
      from: currentUser.uid,
      to: selectedUser.uid,
      text: newMessage.trim() || "",
      image: imageUrl,
      timestamp: new Date(),
    };

    const convoSnap = await getDoc(convoRef);

    if (convoSnap.exists()) {
      await updateDoc(convoRef, {
        messages: arrayUnion(newMsg),
        lastMessage: newMsg.text || "📷 Image",
        updatedAt: newMsg.timestamp,
      });
    } else {
      await setDoc(convoRef, {
        participants: [currentUser.uid, selectedUser.uid],
        messages: [newMsg],
        lastMessage: newMsg.text || "📷 Image",
        updatedAt: newMsg.timestamp,
      });
    }

    setImage(null);
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  };

  // delete messages option
  const handleDeleteMessages = async (ids: string[]) => {
    if (!currentUser || !selectedUser) return;

    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);
    const convoSnap = await getDoc(convoRef);
    if (!convoSnap.exists()) return;

    const data = convoSnap.data();
    const updatedMessages = (data.messages as Message[]).filter(
      (m) => !ids.includes(m.id ?? "")
    );

    // ✅ update Firestore
    await updateDoc(convoRef, { messages: updatedMessages });

    // ✅ update UI instantly
    setMessages(updatedMessages);
  };

  // Image Upload
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
            id: uuidv4(), // ✅
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
          setTimeout(
            () =>
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
            50
          );
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
      { method: "POST", body: formData }
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

  // Delete entire conversation
  const handleDeleteChat = async () => {
    if (!currentUser || !selectedUser) return;

    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);
    await updateDoc(convoRef, { messages: [] }); // clear all messages
    setMessages([]);
    setDeleteConfirmOpen(false);
  };

  return (
    // use 100dvh to avoid mobile vh/keyboard quirks
    // this 100 dvh means that the height is always 100% of the viewport height,
    // even when the mobile browser UI (address bar, etc.) shows/hides
    <div className="flex flex-col sm:flex-row h-screen w-full overflow-hidden bg-[#E5E5EA]">
      {/* Overlay behind sidebar on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
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
        className="z-30"
      />

      {/* Main area */}
      <main className="flex-1 flex flex-col min-h-0">
        {selectedUser ? (
          <>
            <ChatHeader
              user={selectedUser}
              onBack={() => setIsSidebarOpen(true)}
              onLogout={() => setIsModalOpen(true)}
              onDeleteChat={() => setDeleteConfirmOpen(true)} // new line
              className="z-30"
            />

            <ChatWindow
              messages={messages}
              currentUser={currentUser!}
              newMessage={newMessage}
              setImage={setImage}
              setNewMessage={setNewMessage}
              onSendMessage={sendMessage}
              messagesEndRef={messagesEndRef}
              onDeleteMessages={handleDeleteMessages}
            />
          </>
        ) : (
          <>
            {/* Mobile top bar when none selected */}
            <div className="sm:hidden flex items-center justify-between p-4 border-b bg-white shadow-sm z-30">
              <h2 className="font-semibold text-gray-800 text-lg">Chats</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-700 text-white text-sm px-3 py-1 rounded-full hover:bg-gray-900"
              >
                Logout
              </button>
            </div>

            {/* Placeholder */}
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 px-4 text-center">
              <h2 className="text-lg font-semibold mb-2">
                Select a chat to start messaging
              </h2>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="sm:hidden mt-2 bg-blue-500 text-white min-w-0 px-2 py-2 rounded-full"
              >
                Open Chats
              </button>
            </div>
          </>
        )}
      </main>

      {/* Logout Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
      {/* Delete Chat Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteChat}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This cannot be undone."
        confirmText="Delete"
        confirmColor="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
