"use client";
import { ChatHeaderProps } from "@/app/types/interface";
import Image from "next/image";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function ChatHeader({
  user,
  currentUser,
  onBack,
  onLogout,
  onDeleteChat,
  className = "",
}: ChatHeaderProps & { onDeleteChat?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveUser, setLiveUser] = useState(user);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setLiveUser((prev) => ({ ...prev, ...docSnap.data() }));
      }
    });

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    currentUser.name || currentUser.email || "User"
  )}&background=random&color=fff&size=64`;

  const contactAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    liveUser.name || liveUser.email || "User"
  )}&background=random&color=fff&size=64`;
  if (!user) return null;

  return (
    <div
      className={`p-3 sm:p-4 border-b bg-white flex items-center justify-between gap-3 shadow-sm ${className}`}
      role="banner"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="sm:hidden text-gray-600 hover:text-black flex-shrink-0"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6 cursor-pointer" />
        </button>

        <Image
          src={contactAvatar}
          alt="User Avatar"
          width={40}
          height={40}
          className="rounded-full hidden sm:inline-block flex-shrink-0"
        />

        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-lg truncate max-w-[60vw] sm:max-w-none">
            {liveUser.name || liveUser.email || "Unknown User"}
          </span>
          <span className="text-sm text-gray-500">
            {liveUser.isOnline
              ? "Online"
              : liveUser.lastSeen
                ? `Last seen ${new Date(
                    "seconds" in (liveUser.lastSeen || {})
                      ? (liveUser.lastSeen as Timestamp).toDate()
                      : (liveUser.lastSeen as Date)
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-full overflow-hidden w-10 h-10 border cursor-pointer hover:opacity-90 transition"
          aria-label="User Menu"
        >
          <Image
            src={avatarSrc}
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute text-xsm right-2 top-12 max-sm:right-2 max-sm:top-11 bg-white shadow-lg rounded-lg w-36 text-sm sm:text-base border z-50"
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                onDeleteChat?.();
              }}
              className="flex cursor-pointer hover:scale-[108%] rounded-2xl hover:text-red-600 items-center gap-2 px-3 py-2 hover:bg-gray-100 text-black w-full"
            >
              Delete Chat
              <Trash2 size={13} className="text-sm sm:block " />
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout?.();
              }}
              className="flex cursor-pointer hover:scale-[108%] rounded-2xl items-center gap-2 px-3 py-2 hover:text-blue-500 hover:bg-gray-100 w-full text-gray-800 font"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
