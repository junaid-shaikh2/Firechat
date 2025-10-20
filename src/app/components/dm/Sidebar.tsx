"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { SidebarProps } from "@/app/types/interface";
import { auth, db } from "@/app/lib/firebase";
import {
  doc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { Image as ImageIcon, Mic, Headphones } from "lucide-react";

export default function Sidebar({
  users,
  filteredUsers,
  searchTerm,
  selectedUser,
  onSelectUser,
  onSearch,
  onLogout,
  isOpen = false,
  onClose,
  className = "",
}: SidebarProps) {
  const [lastMessages, setLastMessages] = React.useState<
    Record<string, string>
  >({});
  const list = searchTerm.trim() ? filteredUsers : users;

  // Track user online/offline
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);

    updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() });

    const handleOffline = () => {
      updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() });
    };

    window.addEventListener("beforeunload", handleOffline);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleOffline();
      else updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() });
    });

    return () => {
      handleOffline();
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, []);

  // Fetch last message for each chat
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const unsubscribers = list.map((u) => {
      const convoId = [uid, u.uid].sort().join("_");
      const convoRef = doc(db, "dmChats", convoId);

      return onSnapshot(convoRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const msgs = data.messages || [];
        const last = msgs[msgs.length - 1];
        if (!last) return;

        let preview = "";
        const sender =
          users.find((user) => user.uid === last.from)?.name || "Someone";

        if (last.reactions && Object.keys(last.reactions).length > 0) {
          const emoji = last.reactions[Object.keys(last.reactions)[0]];
          if (last.image) {
            preview = `${sender} reacted ${emoji} to [PHOTO]`;
          } else if (last.audio) {
            preview = `${sender} reacted ${emoji} to [AUDIO]`;
          } else if (last.text) {
            preview = `${sender} reacted ${emoji} to "${last.text.slice(0, 15)}..."`;
          } else {
            preview = `${sender} reacted ${emoji}`;
          }
        } else if (last.image) {
          preview = "__IMAGE__";
        } else if (last.audio) {
          const duration = last.duration || "";
          preview = `__AUDIO__${duration}`;
        } else if (last.text) {
          preview =
            last.text.length > 25
              ? `${last.text.substring(0, 25)}...`
              : last.text;
        }

        setLastMessages((prev) => ({ ...prev, [u.uid]: preview }));
      });
    });

    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, [list, users]);

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 bg-white border-r p-4 flex flex-col min-h-0 transform transition-transform duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "sm:static sm:translate-x-0 sm:inset-auto sm:z-auto sm:w-72",
        "w-[85vw] max-w-xs sm:max-w-none",
        className,
      ].join(" ")}
    >
      {/* Mobile header */}
      <div className="sm:hidden mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-md sm:text-large">
          Direct Messages
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
        >
          ✕
        </button>
      </div>

      <h2 className="hidden sm:block font-semibold mb-3 text-gray-800 text-lg">
        Direct Messages
      </h2>

      <div className="mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={onSearch}
          placeholder="Search users..."
          className="border border-gray-300 text-gray-600 focus:border-gray-500 focus:ring-0 focus:outline-none px-3 py-2 rounded-lg w-full text-sm bg-gray-50"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 overscroll-contain">
        {list.map((user) => {
          const preview = lastMessages[user.uid];
          return (
            <div
              key={user.uid}
              onClick={() => onSelectUser(user)}
              className={[
                "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition min-w-0",
                selectedUser?.uid === user.uid
                  ? "bg-gray-400 text-white font-semibold opacity-90"
                  : "hover:bg-gray-100 text-gray-800",
              ].join(" ")}
            >
              <div className="relative flex-shrink-0">
                <Image
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name || user.email || "User"
                  )}&background=random&color=fff&size=64`}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              <div className="flex flex-col truncate w-full">
                <div className="font-medium truncate">
                  {user.name || user.email}
                </div>
                <div className="text-xs text-gray-700 flex items-center gap-1 truncate">
                  {preview === "__IMAGE__" ? (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
                      <span>Photo</span>
                    </>
                  ) : preview?.startsWith("__AUDIO__") ? (
                    <>
                      <Mic className="w-3.5 h-3.5 text-gray-600" />
                      <span>{preview.replace("__AUDIO__", "").trim()}</span>
                    </>
                  ) : preview?.includes("reacted") &&
                    preview.includes("[AUDIO]") ? (
                    <>
                      <Headphones className="w-3.5 h-3.5 text-gray-600" />
                      <span>{preview.replace("[AUDIO]", "Audio")}</span>
                    </>
                  ) : preview?.includes("reacted") &&
                    preview.includes("[PHOTO]") ? (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
                      <span>{preview.replace("[PHOTO]", "Photo")}</span>
                    </>
                  ) : (
                    <span>{preview || "No messages yet"}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 shrink-0">
        <button
          onClick={onLogout}
          className="bg-gray-700 hover:bg-gray-900 text-white py-2 rounded-full cursor-pointer"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
