"use client";
import { useEffect, useState, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type { ChatWindowProps } from "@/app/types/interface";
import { Trash2, Mic, Square, ImageIcon, X } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";

export default function ChatWindow({
  currentUser,
  messages,
  newMessage,
  setNewMessage,
  setImage,
  image,
  onSendMessage,
  isRecording,
  startRecording,
  stopRecording,
  messagesEndRef,
  onDeleteMessages,
  audioBlob,
  setAudioBlob,
  onReact,
  onTyping,
}: ChatWindowProps & {
  onDeleteMessages: (ids: string[]) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onReact?: (msgId: string, emoji: string) => void;
  onTyping?: (text: string) => void;
}) {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [prevLength, setPrevLength] = useState(0);
  const isSelectionMode = selectedMessages.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Only scroll when a new message is added
  useEffect(() => {
    if (messages.length > prevLength) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setPrevLength(messages.length);
  }, [messages, messagesEndRef, prevLength]);

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

  const getDateString = (timestamp: Timestamp | Date) => {
    const d = new Date(
      "seconds" in timestamp ? timestamp.seconds * 1000 : timestamp
    );
    return d.toDateString();
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#E5E5EA] overflow-hidden">
      {isSelectionMode && (
        <div className="flex items-center justify-between bg-blue-500 text-white px-4 py-2 shadow-sm">
          <span>{selectedMessages.length} selected</span>
          <div className="flex gap-3 items-center">
            <button
              onClick={confirmDelete}
              className="hover:bg-blue-600 p-2 rounded-full cursor-pointer transition"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={clearSelection}
              className="text-sm cursor-pointer underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 overscroll-contain">
        {messages.map((msg, index) => {
          const isOwn = msg.from === currentUser?.uid;

          const currentDate = msg.timestamp
            ? getDateString(
                "seconds" in msg.timestamp
                  ? new Timestamp(
                      msg.timestamp.seconds,
                      msg.timestamp.nanoseconds
                    )
                  : msg.timestamp
              )
            : "";
          const prevDate =
            index > 0 && messages[index - 1].timestamp
              ? getDateString(
                  (() => {
                    const ts = messages[index - 1].timestamp;
                    if (ts instanceof Timestamp || ts instanceof Date)
                      return ts;
                    if (
                      ts &&
                      typeof ts === "object" &&
                      "seconds" in ts &&
                      "nanoseconds" in ts
                    ) {
                      return new Timestamp(ts.seconds, ts.nanoseconds);
                    }
                    return ts as Date;
                  })()
                )
              : "";
          const showDate = currentDate !== prevDate;

          return (
            <MessageBubble
              key={msg.id || index}
              msg={msg}
              isOwn={isOwn}
              showDate={showDate}
              onSelect={toggleSelect}
              isSelected={selectedMessages.includes(msg.id!)}
              isSelectionMode={isSelectionMode}
              onDeleteSingle={(id) => onDeleteMessages([id])}
              onReact={onReact}
              currentUser={currentUser!}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {!isSelectionMode && (
        <div className="relative p-3 border-t bg-white">
          <div className="flex items-center gap-2 w-full">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setImage(file);
                  e.target.value = "";
                } else {
                  setImage(null);
                }
              }}
            />

            {image && (
              <div className="absolute bottom-full left-0 mb-2 bg-white shadow-md rounded-lg p-2 flex items-center gap-2 border">
                <Image
                  src={URL.createObjectURL(image)}
                  alt="preview"
                  className="w-10 h-10 object-cover rounded"
                  width={40}
                  height={40}
                />
                <span className="text-sm text-gray-700 truncate max-w-[120px]">
                  {image.name}
                </span>
                <button
                  onClick={() => setImage(null)}
                  className="text-red-500 text-xs ml-2 hover:underline"
                >
                  ✕
                </button>
              </div>
            )}

            {audioBlob && (
              <div className="absolute bottom-full left-0 mb-2 bg-white shadow-md rounded-xl px-3 py-2 flex items-center justify-between w-56 border">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <Mic size={16} />
                  </div>
                  <span className="text-sm text-gray-700">Recorded</span>
                </div>
                <button
                  onClick={() => setAudioBlob(null)}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded-full transition"
                  aria-label="Remove voice message"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <label
              htmlFor="imageUpload"
              className="cursor-pointer flex-shrink-0 bg-gray-100 text-gray-600 text-2xl hover:bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center"
            >
              <ImageIcon />
            </label>

            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                onTyping?.(e.target.value);
              }}
              placeholder="Message"
              className="flex-1 min-w-0 border-none bg-gray-100 rounded-full px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (newMessage.trim() || image || audioBlob)
                ) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow animate-pulse"
              >
                <Square size={18} />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-10 h-10 flex items-center justify-center shadow cursor-pointer"
              >
                <Mic size={18} />
              </button>
            )}

            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim() && !image && !audioBlob}
              className="bg-blue-500 flex-shrink-0 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow cursor-pointer"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
