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
import { nlNL } from "@mui/material/locale";

// ✅ Cloudinary environment variables
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_PRESET_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME || "";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      setIsOpen(true);
    }
  }, []);

  // ✅ Auth listener
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

  // ✅ Load users except current
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

  // ✅ Load messages
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

  // ✅ Search users
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

  // ✅ Select a chat
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

  // ✅ Upload Image to Cloudinary
  const uploadImage = async (file: File) => {
    console.log("Uploading image to Cloudinary...");
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_PRESET_NAME) {
      throw new Error("Cloudinary environment variables are missing!");
    }

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
    } else {
      console.log("Image uploaded successfully");
    }

    const data = await response.json();
    return data.secure_url as string;
  };

  // ✅ Send message
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
      const isImage = image.type?.startsWith("image/");
      const under10MB = image.size <= 10 * 1024 * 1024;
      if (!isImage || !under10MB) {
        alert(
          !isImage
            ? "Please select a valid image file."
            : "Image is too large (max 10MB)."
        );
        setImage(image as unknown as File);
        return;
      }
      try {
        imageUrl = await uploadImage(image);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert(
          "Image upload failed. Check your Cloudinary cloud name and preset, and ensure the preset is unsigned."
        );
        return;
      }
    }

    let audioUrl: string | null = null;
    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append("file", audioBlob);
        formData.append("upload_preset", CLOUDINARY_PRESET_NAME);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
          { method: "POST", body: formData }
        );
        const data = await response.json();
        audioUrl = data.secure_url;
      } catch (err) {
        console.error("Audio upload failed:", err);
      }
    }
    setAudioBlob(null);

    const newMsg = {
      id: uuidv4(),
      from: currentUser.uid,
      to: selectedUser.uid,
      text: newMessage.trim() || "",
      image: imageUrl,
      audio: audioUrl, // 👈 added
      timestamp: new Date(),
    };

    // const newMsg = {
    //   id: uuidv4(),
    //   from: currentUser.uid,
    //   to: selectedUser.uid,
    //   text: newMessage.trim() || "",
    //   image: imageUrl,
    //   timestamp: new Date(),
    // };

    setNewMessage("");

    const convoSnap = await getDoc(convoRef);
    if (convoSnap.exists()) {
      await updateDoc(convoRef, {
        messages: arrayUnion(newMsg),
        // now to add the audio option too in the last message object
        lastMessage: newMsg.text || (newMsg.image ? "📷 Image" : "🎤 Audio"),
        updatedAt: newMsg.timestamp,
      });
    } else {
      await setDoc(convoRef, {
        participants: [currentUser.uid, selectedUser.uid],
        messages: [newMsg],
        lastMessage: newMsg.text || (newMsg.image ? "📷 Image" : "🎤 Audio"),
        updatedAt: newMsg.timestamp,
      });
    }

    setImage(null);
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

  // ✅ Delete selected messages
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

  // ✅ Delete entire conversation
  const handleDeleteChat = async () => {
    if (!currentUser || !selectedUser) return;
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);
    await updateDoc(convoRef, { messages: [] });
    setMessages([]);
    setDeleteConfirmOpen(false);
  };

  // ✅ Logout
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
      {/* Overlay behind sidebar (mobile) */}
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

      {/* Chat area */}
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
          <>
            <div className="sm:hidden flex items-center justify-between p-4 border-b bg-white shadow-sm z-30">
              <h2 className="font-semibold text-gray-800 text-lg">Chats</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-700 cursor-pointer text-white text-sm px-3 py-1 rounded-full hover:bg-gray-900"
              >
                Logout
              </button>
            </div>

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
          </>
        )}
      </main>

      {/* Modals */}
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
