"use client";
import React, { useEffect, useState } from "react";
import MessageBubble from "./MessageBubble";
import { ChatWindowProps } from "@/app/types/interface";
import { Trash2 } from "lucide-react";

export default function ChatWindow({
  currentUser,
  messages,
  newMessage,
  setNewMessage,
  setImage,
  onSendMessage,
  messagesEndRef,
  onDeleteMessages,
}: ChatWindowProps & { onDeleteMessages: (ids: string[]) => void }) {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const isSelectionMode = selectedMessages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesEndRef]);

  const toggleSelect = (id: string) => {
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((msgId) => msgId !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedMessages([]);

  const confirmDelete = () => {
    onDeleteMessages(selectedMessages);
    clearSelection();
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#E5E5EA] overflow-hidden">
      {/* Header for selection mode */}
      {isSelectionMode && (
        <div className="flex items-center justify-between bg-blue-500 text-white px-4 py-2 shadow-sm">
          <span>{selectedMessages.length} selected</span>
          <div className="flex gap-3 items-center">
            <button
              onClick={confirmDelete}
              className="hover:bg-blue-600 p-2 rounded-full transition"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={clearSelection} className="text-sm underline">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 overscroll-contain">
        {messages.map((msg, index) => {
          const isOwn = msg.from === currentUser?.uid;
          const msgDate = msg.timestamp
            ? "seconds" in msg.timestamp
              ? new Date(msg.timestamp.seconds * 1000).toLocaleDateString()
              : msg.timestamp.toLocaleDateString()
            : "";

          return (
            <MessageBubble
              key={msg.id || index}
              msg={msg}
              isOwn={isOwn}
              showDate={false}
              onSelect={toggleSelect}
              isSelected={selectedMessages.includes(msg.id!)}
              isSelectionMode={isSelectionMode}
              onDeleteSingle={(id) => onDeleteMessages([id])}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isSelectionMode && (
        <div className="relative p-3 border-t bg-white">
          <div className="relative w-full flex items-center gap-2">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImage(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />

            <label
              htmlFor="imageUpload"
              className="cursor-pointer flex-shrink-0 bg-gray-100 text-gray-600 text-2xl hover:bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center"
            >
              +
            </label>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message"
              className="flex-1 border-none bg-gray-100 rounded-full px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSendMessage();
              }}
            />

            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-500 flex-shrink-0 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
