// ChatHeader.tsx
import { ChatHeaderProps } from "@/app/types/interface";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

export default function ChatHeader({
  user,
  onBack,
  onLogout,
}: ChatHeaderProps) {
  return (
    <div className="p-4 border-b bg-white flex items-center justify-between gap-3 shadow-sm">
      {/* LEFT SECTION (Back + User Info) */}
      <div className="flex items-center gap-3">
        {/* Back button (mobile only) */}
        <button
          onClick={onBack}
          className="sm:hidden text-gray-600 hover:text-black"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* User Avatar */}
        <Image
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name || user.email || "User"
          )}&background=random&color=fff&size=64`}
          alt="User Avatar"
          width={40}
          height={40}
          className="rounded-full hidden sm:inline-block"
        />

        {/* User Name */}
        <span className="font-semibold text-gray-800 text-lg truncate max-w-[140px] sm:max-w-none">
          {user.name || user.email || "Unknown User"}
        </span>
      </div>

      {/* RIGHT SECTION (Logout Button) */}
      <button
        onClick={onLogout}
        className="sm:hidden bg-gray-700 text-white text-sm px-3 py-1 rounded-full hover:bg-gray-900"
      >
        Logout
      </button>
    </div>
  );
}
