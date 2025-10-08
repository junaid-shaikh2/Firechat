// ChatHeader.tsx
import { User } from "@/app/types/inferface";
import { ChatHeaderProps } from "@/app/types/inferface";

export default function ChatHeader({ user }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm">
      <img
        src={`https://ui-avatars.com/api/?name=${user.name || user.email}&background=random&color=fff&size=64`}
        alt="User avatar"
        className="w-10 h-10 rounded-full"
      />
      <span className="font-semibold text-gray-800 text-lg">
        {user.name || user.email}
      </span>
    </div>
  );
}
