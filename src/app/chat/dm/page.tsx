"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  arrayUnion,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  // const [isTyping, setIsTyping] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null!);

  // Sidebar open by default on desktop
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Handle user auth & online status
  useEffect(() => {
    let handleBeforeUnload: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);

        const setOfflineStatus = async () => {
          await updateDoc(userRef, {
            isOnline: false,
            lastSeen: serverTimestamp(),
          });
        };

        const userSnap = await getDoc(userRef);
        const newUserData: User = {
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "",
          email: user.email || "",
          isOnline: true,
          lastSeen: new Date(),
        };

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            ...newUserData,
            lastSeen: serverTimestamp(),
          });
          setCurrentUser(newUserData);
        } else {
          await updateDoc(userRef, {
            isOnline: true,
            lastSeen: serverTimestamp(),
          });
          setCurrentUser((userSnap.data() as User) || newUserData);
        }

        handleBeforeUnload = setOfflineStatus;
        window.addEventListener("beforeunload", handleBeforeUnload);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      unsubscribe();
      if (handleBeforeUnload)
        window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // for isTyping... (not implemented yet)

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = async (text: string) => {
    setNewMessage(text);

    if (!currentUser || !selectedUser) return;
    const userRef = doc(db, "users", currentUser.uid);

    // Mark typing
    await updateDoc(userRef, { typingTo: selectedUser.uid });

    // Clear old timeout if exists
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    // Stop typing after 2s of inactivity
    typingTimeout.current = setTimeout(async () => {
      await updateDoc(userRef, { typingTo: null });
    }, 2000);
  };

  // Load & sort users by online status
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs
        .map((d) => d.data() as User)
        .filter((u) => u.uid !== currentUser.uid);

      usersList.sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        const nameA = a.name || a.email || "";
        const nameB = b.name || b.email || "";
        return nameA.localeCompare(nameB);
      });

      setUsers(usersList);

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        setFilteredUsers(
          usersList.filter(
            (u) =>
              u.name?.toLowerCase().includes(term) ||
              u.email?.toLowerCase().includes(term)
          )
        );
      } else {
        setFilteredUsers([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, searchTerm]);

  // for seen deliver sent status
  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);

    const unsubscribe = onSnapshot(convoRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const msgs = (data.messages as Message[]) || [];

        setMessages(msgs);

        msgs.forEach(async (msg) => {
          if (msg.to === currentUser.uid && msg.status === "sent") {
            const updated = msgs.map((m) =>
              m.id === msg.id ? { ...m, status: "delivered" } : m
            );
            await updateDoc(convoRef, { messages: updated });
          }
        });
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser || messages.length === 0) return;

    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);

    const updated = messages.map((msg) => {
      if (msg.from === selectedUser.uid && msg.status !== "read") {
        return { ...msg, status: "read" };
      }
      return msg;
    });

    const hasSeenChange = updated.some(
      (m, i) => m.status !== messages[i]?.status
    );

    if (hasSeenChange) {
      updateDoc(convoRef, { messages: updated });
    }
  }, [selectedUser, messages, currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);

    const unsubscribe = onSnapshot(convoRef, (snapshot) => {
      if (snapshot.exists()) {
        setMessages((snapshot.data().messages as Message[]) || []);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

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
    if (window.innerWidth < 640) setIsSidebarOpen(false);
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const uploadToCloudinary = async (file: File | Blob) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url as string;
  };

  // useEffect(() => {
  //   if (!currentUser || !selectedUser) return;

  //   const userRef = doc(db, "users", selectedUser.uid);
  //   const unsubscribe = onSnapshot(userRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const data = snapshot.data();
  //       setIsTyping(data.typingTo === currentUser.uid);
  //     }
  //   });

  //   return () => unsubscribe();
  // }, [currentUser, selectedUser]);

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
    let audioUrl: string | null = null;

    if (image) imageUrl = await uploadToCloudinary(image);
    if (audioBlob) audioUrl = await uploadToCloudinary(audioBlob);

    const newMsg: Message = {
      id: uuidv4(),
      from: currentUser.uid,
      to: selectedUser.uid,
      text: newMessage.trim() || "",
      timestamp: new Date(),
      reactions: {},
      status: "sent",
    };

    if (imageUrl) newMsg.image = imageUrl;
    if (audioUrl) newMsg.audio = audioUrl;

    setNewMessage("");
    setImage(null);
    setAudioBlob(null);

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

  const handleReaction = async (msgId: string | undefined, emoji: string) => {
    if (!currentUser || !selectedUser || !msgId) return;
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const convoRef = doc(db, "dmChats", conversationId);
    const convoSnap = await getDoc(convoRef);
    if (!convoSnap.exists()) return;

    const data = convoSnap.data();
    const msgs: Message[] = (data.messages as Message[]) || [];

    const updated = msgs.map((m) => {
      if (m.id !== msgId) return m;
      const reactions: Record<string, string[]> = { ...(m.reactions || {}) };
      const alreadyReacted = reactions[emoji]?.includes(currentUser.uid);

      for (const key in reactions) {
        reactions[key] = reactions[key].filter(
          (uid) => uid !== currentUser.uid
        );
        if (reactions[key].length === 0) delete reactions[key];
      }

      if (!alreadyReacted) {
        if (!reactions[emoji]) reactions[emoji] = [];
        reactions[emoji].push(currentUser.uid);
      }

      return { ...m, reactions };
    });

    await updateDoc(convoRef, { messages: updated });
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
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

    const updated = (convoSnap.data().messages as Message[]).filter(
      (m) => !ids.includes(m.id ?? "")
    );

    await updateDoc(convoRef, { messages: updated });
    setMessages(updated);
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
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    }
    setIsModalOpen(false);
    await signOut(auth);
    setCurrentUser(null);
    setSelectedUser(null);
    setMessages([]);
    window.location.href = "/";
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
              currentUser={currentUser!}
              onBack={() => setIsSidebarOpen(true)}
              onLogout={() => setIsModalOpen(true)}
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
              onReact={handleReaction}
              image={image}
              onTyping={handleTyping}
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
