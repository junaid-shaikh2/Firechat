import React from "react";
import { MessageBubbleProps } from "@/app/types/interface";
import Image from "next/image";

export default function MessageBubble({
  msg,
  isOwn,
  showDate,
}: MessageBubbleProps) {
  const time = msg.timestamp
    ? new Date(
        "seconds" in msg.timestamp
          ? msg.timestamp.seconds * 1000
          : msg.timestamp
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const date = msg.timestamp
    ? new Date(
        "seconds" in msg.timestamp
          ? msg.timestamp.seconds * 1000
          : msg.timestamp
      ).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  const hasText = !!msg.text;
  const hasImage = !!msg.image;

  return (
    <>
      {showDate && (
        <div className="text-center text-[10px] text-gray-500 my-1">{date}</div>
      )}

      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] ${msg.text ? "sm:px-4 sm:py-2 px-2 py-[6px] rounded-2xl" : "px-1 pt-1 rounded]"} rounded text-sm shadow-md transition-all duration-200 ${
            isOwn
              ? `bg-blue-500 text-white rounded-br-none ${hasImage ? "rounded" : ""}`
              : `bg-white text-gray-800 rounded-bl-none  ${hasImage ? "rounded" : ""}`
          } break-words`}
        >
          {hasText && <div className="">{msg.text}</div>}

          {hasImage && (
            <Image
              src={msg.image || ""}
              alt="sent image"
              width={200}
              height={200}
              className={` rounded  ${
                hasText
                  ? "mt-1 border rounded border-gray-300"
                  : "m-0 border border-gray-200 bg-gray-700"
              }`}
            />
          )}

          {time && (
            <div
              className={`text-[10px] mt-1 opacity-70 ${
                isOwn ? "text-right" : "text-left"
              }`}
            >
              {time}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
