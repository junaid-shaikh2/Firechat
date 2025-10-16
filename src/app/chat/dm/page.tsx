"use client";
import { useState, useEffect, useRef } from "react";
import type React from "react";

import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

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
import type { User, Message } from "@/app/types/interface";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(
    null!
  ) as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      setIsOpen(true);
    }
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user)
        setCurrentUser({
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || user.email?.split("@")[0],
        });
    });
    return () => unsubscribe();
  }, []);

  // Load users except current
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

  // Load messages
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

  // Search users
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
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const uploadToCloudinary = async (file: File | Blob) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Cloudinary environment variables are missing!");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cloudinary upload failed:", errText);
      throw new Error("Upload failed: " + errText);
    }

    const data = await response.json();
    return data.secure_url as string;
  };

  const sendMessage = async () => {
    if (
      (!newMessage.trim() && !image && !audioBlob) ||
      !currentUser ||
      !selectedUser
    )
      return;

    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);

    let imageUrl: string | null = null;
    if (image) {
      try {
        imageUrl = await uploadToCloudinary(image);
      } catch (err) {
        console.error("Image upload error:", err);
        alert("Image upload failed. Check Cloudinary credentials and preset.");
        return;
      }
    }

    let audioUrl: string | null = null;
    if (audioBlob) {
      try {
        audioUrl = await uploadToCloudinary(audioBlob);
      } catch (err) {
        console.error("Audio upload error:", err);
        alert("Audio upload failed. Check Cloudinary credentials and preset.");
        return;
      }
      setAudioBlob(null);
    }

    const newMsg: Message = {
      id: uuidv4(),
      from: currentUser.uid,
      to: selectedUser.uid,
      text: newMessage.trim() || "",
      timestamp: new Date(),
    };

    if (imageUrl) newMsg.image = imageUrl;
    if (audioUrl) newMsg.audio = audioUrl;

    setNewMessage("");
    setImage(null);

    const convoSnap = await getDoc(convoRef);
    const lastMessage =
      newMsg.text || newMsg.image ? "Image" : newMsg.audio ? "Audio" : "";

    if (convoSnap.exists()) {
      await updateDoc(convoRef, {
        messages: arrayUnion(newMsg),
        lastMessage,
        updatedAt: newMsg.timestamp,
      });
    } else {
      await setDoc(convoRef, {
        participants: [currentUser.uid, selectedUser.uid],
        messages: [newMsg],
        lastMessage,
        updatedAt: newMsg.timestamp,
      });
    }

    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setNewMessage("");
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Please allow microphone access to record voice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

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

    await updateDoc(convoRef, { messages: updatedMessages });
    setMessages(updatedMessages);
  };

  const handleDeleteChat = async () => {
    if (!currentUser || !selectedUser) return;
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);
    await updateDoc(convoRef, { messages: [] });
    setMessages([]);
    setDeleteConfirmOpen(false);
  };

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
    <div className="flex flex-col sm:flex-row h-screen w-full overflow-hidden bg-[#E5E5EA]">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

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

      <main className="flex-1 flex flex-col min-h-0">
        {selectedUser ? (
          <>
            <ChatHeader
              user={selectedUser}
              onBack={() => setIsSidebarOpen(true)}
              onLogout={() => setIsModalOpen(true)}
              onDeleteChat={() => setDeleteConfirmOpen(true)}
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
              audioBlob={audioBlob}
              setAudioBlob={setAudioBlob}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              onDeleteMessages={handleDeleteMessages}
              image={image}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 px-4 text-center">
            <h2 className="text-lg font-semibold mb-2">
              Select a chat to start messaging
            </h2>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="sm:hidden mt-2 bg-blue-500 text-white px-3 py-2 rounded-full"
            >
              Open Chats
            </button>
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
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
