import React from "react";
import { Message } from "@/app/types/inferface";

// This file is for the timestamp and the message bubble styling (message bubble is actually a date shown in between messages if the date changes)
import { MessageBubbleProps } from "@/app/types/inferface";
export default function MessageBubble({
  msg,
  isOwn,
  showDate,
}: MessageBubbleProps) {
  const time = msg.timestamp
    ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const date = msg.timestamp
    ? new Date(msg.timestamp.seconds * 1000).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <>
      {showDate && (
        <div className="text-center text-[10px] text-gray-500 my-1">{date}</div>
      )}
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-md transition-all duration-200 ${
            isOwn
              ? "bg-blue-500 text-white rounded-br-none"
              : "bg-white text-gray-800 rounded-bl-none"
          } break-words`}
        >
          <div>{msg.text}</div>
          {time && (
            <div
              className={`text-[10px] mt-1 opacity-70 ${isOwn ? "text-right" : "text-left"}`}
            >
              {time}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
