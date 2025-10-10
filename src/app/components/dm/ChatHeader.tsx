// ChatHeader.tsx
import { ChatHeaderProps } from "@/app/types/interface";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

export default function ChatHeader({ user, onBack }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm">
      <button
        onClick={onBack}
        className="sm:hidden text-gray-600 hover:text-black mr-1"
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
        className="rounded-full hidden sm:inline-block"
      />

      <span className="font-semibold text-gray-800 text-lg">
        {user.name || user.email || "Unknown User"}
      </span>
    </div>
  );
}
