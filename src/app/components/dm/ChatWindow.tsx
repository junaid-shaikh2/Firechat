import React, { useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { User } from "@/app/types/inferface";
import { Message } from "@/app/types/inferface";
import { ChatWindowProps } from "@/app/types/inferface";

export default function ChatWindow({
  currentUser,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  messagesEndRef,
}: ChatWindowProps) {
  let lastDate = "";

  // ✅ Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#E5E5EA]">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 overscroll-contain">
        {messages.map((msg) => {
          const isOwn = msg.from === currentUser?.uid;
          const msgDate = msg.timestamp
            ? new Date(msg.timestamp.seconds * 1000).toLocaleDateString()
            : "";

          const showDate = lastDate !== msgDate;
          lastDate = msgDate;

          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={isOwn}
              showDate={showDate}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="relative w-full">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message"
            className="w-full border-none bg-gray-100 rounded-full px-4 py-3 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendMessage();
            }}
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold shadow"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
