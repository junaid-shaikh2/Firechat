"use client";
import { useState, useRef, useEffect } from "react";
import type { MessageBubbleProps } from "@/app/types/interface";
import Image from "next/image";
import { MoreVertical, Trash2 } from "lucide-react";

export default function MessageBubble({
  msg,
  isOwn,
  showDate,
  onSelect,
  isSelected,
  isSelectionMode,
  onDeleteSingle,
}: MessageBubbleProps & {
  onSelect: (msgId: string) => void;
  isSelected: boolean;
  isSelectionMode: boolean;
  onDeleteSingle: (msgId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); //

  // 👇 added click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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

      <div
        className={`flex relative ${isOwn ? "justify-end" : "justify-start"}`}
        onContextMenu={(e) => {
          e.preventDefault();
          onSelect(msg.id!);
        }}
        onClick={() => isSelectionMode && onSelect(msg.id!)}
      >
        <div
          className={`relative group max-w-[75%] ${
            msg.text ? "sm:px-4 sm:py-2 px-2 py-[6px]" : "px-0.5 pt-0.5 pb-0.5"
          } rounded-2xl text-sm shadow-md transition-all duration-200 break-words
         ${
           isOwn
             ? `bg-blue-500 text-white ${hasImage ? "" : "rounded-br-none"} ${
                 hasImage ? "rounded-md" : ""
               }`
             : `bg-white text-gray-800 ${hasImage ? "" : "rounded-bl-none"} ${
                 hasImage ? "rounded-md" : ""
               }`
         } ${isSelected ? "ring-2 ring-blue-400 scale-[0.98]" : "hover:scale-[1.01]"}`}
        >
          {hasText && <div>{msg.text}</div>}
          {hasImage && (
            <Image
              src={msg.image || ""}
              alt="sent image"
              width={200}
              height={200}
              unoptimized
              className="rounded-md m-0.5 border border-gray-300"
            />
          )}
          {time && (
            <div
              className={`text-[9px] mt-0.5 opacity-70 ${
                isOwn ? "text-right" : "text-left"
              }`}
            >
              {time}
            </div>
          )}

          {/* Menu wrapper with ref */}
          {isOwn && !isSelectionMode && (
            <div className="absolute top-0 right-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity p-1"
              >
                <MoreVertical size={14} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 bg-white shadow-md rounded-md text-gray-800 text-sm z-50">
                  <button
                    onClick={() => {
                      onDeleteSingle(msg.id!);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <Trash2 size={14} className="text-red-500" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
