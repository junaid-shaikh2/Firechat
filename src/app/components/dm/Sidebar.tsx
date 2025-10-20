"use client";
import React from "react";
import { SidebarProps } from "@/app/types/interface";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "@/app/lib/firebase";

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
  const list = searchTerm.trim() ? filteredUsers : users;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    // Mark user online
    updateDoc(userRef, {
      isOnline: true,
      lastSeen: serverTimestamp(),
    });

    // When user closes tab or goes offline
    const handleOffline = () => {
      updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    };

    window.addEventListener("beforeunload", handleOffline);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleOffline();
      else
        updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
    });

    return () => {
      handleOffline();
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, []);

  return (
    <aside
      className={[
        // Base (mobile drawer)
        "fixed   inset-y-0 left-0 z-40 bg-white border-r p-4 flex flex-col min-h-0 transform transition-transform duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop overrides
        "sm:static sm:translate-x-0 sm:inset-auto sm:z-auto sm:w-72",
        // make mobile width sane and desktop width fixed
        "w-[85vw] max-w-xs sm:max-w-none",
        className,
      ].join(" ")}
      aria-hidden={false}
    >
      <div className="sm:hidden mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-md sm:text-large">
          Direct Messages
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
          aria-label="Close sidebar"
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
          aria-label="Search users"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 overscroll-contain">
        {list.map((user) => (
          <div
            key={user.uid}
            onClick={() => onSelectUser(user)}
            className={[
              "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition min-w-0",
              selectedUser?.uid === user.uid
                ? "bg-gray-400 text-white font-semibold opacity-90"
                : "hover:bg-gray-100 text-gray-800",
            ].join(" ")}
            title={user.name || user.email}
          >
            {/* User Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name || user.email || "User"
                )}&background=random&color=fff&size=64`}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              {/* Online/Offline Indicator */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  user.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>

            {/* Name + Online/Last Seen */}
            <div className="flex flex-col truncate">
              <div className="font-medium">{user.name || user.email}</div>
              <div className="text-xs text-gray-700">
                {user.isOnline
                  ? "Online"
                  : user.lastSeen
                    ? `Last seen ${new Date(
                        "seconds" in (user.lastSeen || {})
                          ? (user.lastSeen as any).toDate()
                          : user.lastSeen
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Offline"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 shrink-0">
        <button
          onClick={onLogout}
          className="bg-gray-700 cursor-pointer hover:bg-gray-900 text-white py-2 rounded-full"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
