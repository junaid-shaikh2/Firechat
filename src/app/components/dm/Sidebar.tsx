import React from "react";
import { User } from "@/app/types/inferface";
import { SidebarProps } from "@/app/types/inferface";

export default function Sidebar({
  users,
  filteredUsers,
  searchTerm,
  selectedUser,
  onSelectUser,
  onSearch,
  onLogout,
}: SidebarProps) {
  return (
    <div className="border-r p-4 bg-white flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 flex flex-col">
        <h2 className="font-semibold mb-3 text-gray-800 text-lg">
          Direct Messages
        </h2>

        {/* Search Bar */}
        <div className="mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={onSearch}
            placeholder="Search users..."
            className="border border-gray-300 text-gray-600 focus:border-gray-500 focus:ring-0 focus:outline-none px-3 py-2 rounded-lg w-full text-sm bg-gray-50"
          />
        </div>

        {/* Users List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 overscroll-contain">
          {(searchTerm.trim() ? filteredUsers : users).map((user) => (
            <div
              key={user.uid}
              className={`p-2 rounded-xl cursor-pointer text-sm transition ${
                selectedUser?.uid === user.uid
                  ? "bg-gray-500 text-white font-semibold opacity-80"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
              onClick={() => onSelectUser(user)}
            >
              {user.name || user.email}
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-4 flex flex-col gap-2 shrink-0">
        <button
          onClick={onLogout}
          className="bg-gray-700 cursor-pointer hover:bg-gray-900 text-white py-2 rounded-full"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
