// ChatHeader.tsx
"use client";
import { ChatHeaderProps } from "@/app/types/interface";
import Image from "next/image";
import { ChevronLeft, MoreVertical, Trash2 } from "lucide-react";
import { useState, useRef } from "react";

export default function ChatHeader({
  user,
  onBack,
  onLogout,
  onDeleteChat,
  className = "",
}: ChatHeaderProps & { onDeleteChat?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <ChevronLeft className="w-6 h-6" />
        </button>

        <Image
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name || user.email || "User"
          )}&background=random&color=fff&size=64`}
          alt="User Avatar"
          width={40}
          height={40}
          className="rounded-full hidden sm:inline-block flex-shrink-0"
        />

        <span className="font-semibold text-gray-800 text-lg truncate max-w-[60vw] sm:max-w-none">
          {user.name || user.email || "Unknown User"}
        </span>
      </div>

      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-full cursor-pointer hover:bg-gray-100"
          aria-label="Options"
        >
          <MoreVertical size={20} className="text-gray-700" />
        </button>

        {menuOpen && (
          <div className=" cursor-pointer absolute right-0 top-10 bg-white shadow-lg rounded-lg w-36 border z-50">
            <button
              onClick={() => {
                setMenuOpen(false);
                onDeleteChat?.();
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-red-600 w-full"
            >
              <Trash2 size={14} />
              Delete Chat
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout?.();
              }}
              className="flex cursor-pointer text-gray-800 font items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
