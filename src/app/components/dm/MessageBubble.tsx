"use client";
import { useState, useRef, useEffect } from "react";
import type { MessageBubbleProps } from "@/app/types/interface";
import Image from "next/image";
import { MoreVertical, Trash2, Play, Pause } from "lucide-react";

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
  const menuRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // 🕒 Safe timestamp formatting
  const time = msg?.timestamp
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

  const date = msg?.timestamp
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
  const hasAudio = !!msg.audio;

  // 🎧 Audio controls
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () =>
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      {/* 📅 Date */}
      {showDate && (
        <div className="text-center text-[10px] text-gray-500 my-1">{date}</div>
      )}

      <div
        className={`flex relative items-center gap-2 ${
          isOwn ? "justify-end" : "justify-start"
        }`}
        onContextMenu={(e) => {
          e.preventDefault();
          onSelect(msg.id!);
        }}
        onClick={() => isSelectionMode && onSelect(msg.id!)}
      >
        {/* ⋮ Menu (on left side) */}
        {!isSelectionMode && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 cursor-pointer rounded-full hover:bg-gray-100 text-gray-600 transition"
              title="Options"
            >
              <MoreVertical size={16} />
            </button>

            {/* Delete popup (to left of dots) */}
            {menuOpen && (
              <div className="absolute -left-20 top-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-50 animate-fade-in">
                <button
                  onClick={() => {
                    onDeleteSingle(msg.id!);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* 💬 Message bubble */}
        <div
          className={`relative group max-w-[75%] overflow-visible z-20
            ${
              hasAudio
                ? "p-3 m-0"
                : hasText
                  ? "sm:px-4 sm:py-2 px-2 py-[6px]"
                  : "px-0.5 pt-0.5 pb-0.5"
            }
            rounded-2xl text-sm shadow-md transition-all duration-200 break-words
            ${
              isOwn
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-white text-gray-800 rounded-bl-none"
            }
            ${isSelected ? "ring-2 ring-blue-400" : "hover:shadow-lg"}
          `}
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

          {/* 🎧 Audio Player */}
          {hasAudio && (
            <div className="flex items-center gap-3 w-52 max-w-full">
              <button
                onClick={togglePlay}
                className={`p-2 rounded-full ${
                  isOwn ? "bg-white text-blue-500" : "bg-blue-500 text-white"
                } shadow hover:scale-105 transition`}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <div className="flex-1">
                <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-[10px] opacity-70 mt-1">
                  {formatTime(duration * (progress / 100))} /{" "}
                  {formatTime(duration)}
                </div>
              </div>

              <audio ref={audioRef} src={msg.audio} preload="metadata" />
            </div>
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
        </div>
      </div>

      {/* ✨ Small fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </>
  );
}
