"use client";
import React from "react";
import { SidebarProps } from "@/app/types/interface";

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
}: SidebarProps) {
  const list = searchTerm.trim() ? filteredUsers : users;

  return (
    <aside
      className={[
        // Mobile behavior
        "fixed inset-y-0 left-0 z-20  bg-white border-r p-4 flex flex-col min-h-0 transform transition-transform duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "sm:static sm:translate-x-0 sm:inset-auto sm:z-auto sm:w-72",
      ].join(" ")}
    >
      {/* Mobile  with close button */}
      <div className="sm:hidden mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-lg">Direct Messages</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
        >
          ✕
        </button>
      </div>
      {/* Desktop title */}
      <h2 className="hidden sm:block font-semibold mb-3 text-gray-800 text-lg">
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
        {list.map((user) => (
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
      {/* Logout Button */}
      <div className="mt-4  flex-col gap-2 shrink-0 hidden  sm:flex">
        <button
          onClick={onLogout}
          className="bg-gray-700 cursor-pointer hover:bg-gray-900 text-white py-2 rounded-full"
        >
          Logout
        </button>
      </div>
      {/* Right side: Logout button (mobile only) */}
      {/* {!isOpen && (
        <button
          onClick={onLogout}
          className="sm:hidden flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
        >
          <span className="w-5 h-5">Logout</span>
        </button>
      )} */}
    </aside>
  );
}
