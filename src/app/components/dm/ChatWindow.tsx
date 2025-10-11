import React, { useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { ChatWindowProps } from "@/app/types/interface";

export default function ChatWindow({
  currentUser,
  messages,
  newMessage,
  setNewMessage,
  setImage,
  onSendMessage,
  messagesEndRef,
}: ChatWindowProps) {
  let lastDate = "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesEndRef]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[#E5E5EA] overflow-hidden">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 overscroll-contain">
        {messages.map((msg, index) => {
          const isOwn = msg.from === currentUser?.uid;
          const msgDate = msg.timestamp
            ? "seconds" in msg.timestamp
              ? new Date(msg.timestamp.seconds * 1000).toLocaleDateString()
              : msg.timestamp.toLocaleDateString()
            : "";

          const showDate = lastDate !== msgDate;
          lastDate = msgDate;

          return (
            <MessageBubble
              key={
                msg.id ||
                `${msg.from}_${("seconds" in msg.timestamp ? msg.timestamp.seconds : msg.timestamp?.getTime() / 1000) || index}`
              }
              msg={msg}
              isOwn={isOwn}
              showDate={showDate}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
            className="flex-1 min-w-0 border-none bg-gray-100 rounded-full px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
    </div>
  );
}
