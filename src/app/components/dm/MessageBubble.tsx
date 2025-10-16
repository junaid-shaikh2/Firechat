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

  // Format time/date
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

  //  Audio controls
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
      {showDate && (
        <div className="text-center text-[10px] text-gray-500 my-1">{date}</div>
      )}

      <div
        className={`flex items-center gap-2 relative ${
          isOwn ? "justify-end" : "justify-start"
        }`}
        onContextMenu={(e) => {
          e.preventDefault();
          onSelect(msg.id!);
        }}
        onClick={() => isSelectionMode && onSelect(msg.id!)}
      >
        <div
          className={`relative flex items-center ${
            isOwn ? "flex-row-reverse" : "flex-row"
          } gap-1 max-w-[85%]`}
        >
          <div
            className={`relative  group break-words shadow-md transition-all duration-200 rounded-2xl text-sm ${
              hasAudio
                ? "p-2"
                : hasText
                  ? "sm:px-4 sm:py-2 px-2 py-[6px] min-w-0 flex-1"
                  : "px-0.5 pt-0.5 pb-0.5"
            }
  
            
            ${
              isOwn
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-white text-gray-800 rounded-bl-none"
            } ${isSelected ? "ring-2 ring-blue-400" : "hover:shadow-lg"}`}
          >
            {hasText && <div>{msg.text}</div>}

            {hasImage && (
              <Image
                src={msg.image || ""}
                alt="sent image"
                width={200}
                height={200}
                unoptimized
                className="rounded-xl m-0.5 border border-gray-300"
              />
            )}

            {hasAudio && (
              <div className="flex  items-center gap-2 sm:w-40">
                <button
                  onClick={togglePlay}
                  className={`p-1 cursor-pointer rounded-full ${
                    isOwn ? "bg-white text-blue-500" : "bg-blue-500 text-white"
                  } shadow hover:scale-105 transition`}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <div className="flex-1">
                  <div className="w-full flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-800 transition-all"
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

          {/* ⋮ Menu only for own messages */}
          {!isSelectionMode && isOwn && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-0.5 rounded-full hover:bg-gray-100 text-gray-600 transition cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className="absolute top-[-1] -left-16 z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-1 animate-fade-in">
                  <button
                    onClick={() => {
                      onDeleteSingle(msg.id!);
                      setMenuOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-0.5 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </>
  );
}
