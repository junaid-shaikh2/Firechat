"use client";
import { useState, useRef, useEffect } from "react";
import type { MessageBubbleProps } from "@/app/types/interface";
import Image from "next/image";
import { MoreVertical, Trash2, Play, Pause, Smile } from "lucide-react";
import React from "react";

export default function MessageBubble({
  msg,
  isOwn,
  showDate,
  onSelect,
  isSelected,
  isSelectionMode,
  onDeleteSingle,
  onReact,
  currentUser,
}: MessageBubbleProps & {
  onSelect: (msgId: string) => void;
  isSelected: boolean;
  isSelectionMode: boolean;
  onDeleteSingle: (msgId: string) => void;
  onReact?: (msgId: string, emoji: string) => void;
  currentUser?: { uid: string; name?: string; email?: string };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const emojis = ["❤️", "😂", "👍", "😢", "🔥", "😮", "😡"];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedNode = e.target as Node;

      const outsideMenu =
        menuRef.current && !menuRef.current.contains(clickedNode);
      const outsidePicker =
        pickerRef.current && !pickerRef.current.contains(clickedNode);

      if (menuOpen && outsideMenu) {
        setMenuOpen(false);
      }

      if (emojiPickerOpen && outsidePicker) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, emojiPickerOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () =>
      setProgress((audio.currentTime / (audio.duration || 1)) * 100 || 0);
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

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const reactionCounts: [string, string[]][] = msg.reactions
    ? Object.entries(msg.reactions)
    : [];

  const myUid = currentUser?.uid;

  const sortedReactionCounts = reactionCounts.sort(
    ([emojiA, uidsA], [emojiB, uidsB]) => {
      const reactedWithA = myUid ? uidsA.includes(myUid) : false;
      const reactedWithB = myUid ? uidsB.includes(myUid) : false;

      if (reactedWithA && !reactedWithB) return -1;
      if (!reactedWithA && reactedWithB) return 1;

      if (uidsB.length !== uidsA.length) {
        return uidsB.length - uidsA.length;
      }

      return emojiA.localeCompare(emojiB);
    }
  );

  const msgId = msg.id || "";

  return (
    <>
      {showDate && (
        <div className="text-center text-[10px] text-gray-500 my-1">
          {msg.timestamp
            ? new Date(
                "seconds" in msg.timestamp
                  ? msg.timestamp.seconds * 1000
                  : msg.timestamp
              ).toDateString()
            : ""}
        </div>
      )}

      <div
        className={`flex items-center gap-1 relative ${
          isOwn ? "justify-end" : "justify-start"
        }`}
        onContextMenu={(e) => {
          e.preventDefault();
          if (msg.id) onSelect(msg.id);
        }}
        onClick={() => isSelectionMode && msg.id && onSelect(msg.id)}
      >
        <div
          className={`relative flex items-center ${
            isOwn ? "flex-row-reverse" : "flex-row"
          } gap-1 max-w-[85%]`}
        >
          <div className="relative flex">
            <div
              className={`relative  group break-words shadow-md transition-all duration-200 rounded-2xl text-sm ${
                msg.audio
                  ? "p-2 flex-1 flex-wrap"
                  : msg.text
                    ? "sm:px-4 sm:py-2 px-2 py-[6px] min-w-0 flex-1"
                    : "px-0.5 pt-0.5 pb-0.5"
              }
              ${
                isOwn
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              } ${isSelected ? "ring-2 ring-blue-400" : "hover:shadow-lg"}`}
            >
              {msg.text && <div>{msg.text}</div>}

              {msg.image && (
                <Image
                  src={msg.image || ""}
                  alt="sent image"
                  width={200}
                  height={200}
                  unoptimized
                  className="rounded-xl m-0.5 border border-gray-300"
                />
              )}

              {msg.audio && (
                <div className="flex shrink items-center gap-3 max-w-full min-w-[120px]">
                  <button
                    onClick={togglePlay}
                    className={`p-2 rounded-full ${
                      isOwn
                        ? "bg-white text-blue-500"
                        : "bg-blue-500 text-white"
                    } shadow hover:scale-105 transition flex-shrink-0`}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {" "}
                    <div className="w-full flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
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

              {msg.timestamp && (
                <div
                  className={`text-[9px] mt-0.5 opacity-70 flex items-center gap-0.5 ${
                    isOwn ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>
                    {new Date(
                      "seconds" in msg.timestamp
                        ? msg.timestamp.seconds * 1000
                        : msg.timestamp
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>

                  {isOwn && (
                    <>
                      {msg.status === "sent" && (
                        <span className="text-gray-400 ml-1">✓</span>
                      )}
                      {msg.status === "delivered" && (
                        <span className="text-gray-400 ml-1">✓✓</span>
                      )}
                      {msg.status === "read" && (
                        <span className="text-green-300 font-bold ml-1">
                          ✓✓
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {emojiPickerOpen && (
            <div
              ref={pickerRef}
              className={`
      z-50 absolute
      /* KEY: Positions the bottom edge of the picker to the top edge of its parent */
      bottom-full 
      mb-[-10] /* Optional: Add a small space above the bubble */
      ${isOwn ? "left-[-30px] -translate-x-1/2" : "left-[115px] -translate-x-1/2"}


      animate-fade-in
      bg-white border rounded-full shadow-2xl 
      p-1 flex gap-0 
      w-max
    `}
            >
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    if (!msgId || !onReact) return;
                    onReact(msgId, e);
                    setEmojiPickerOpen(false);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-xl rounded-full hover:bg-gray-100 hover:scale- transition cursor-pointer"
                  aria-label={`Add ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {!isSelectionMode && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setEmojiPickerOpen(false);
                }}
                className="p-0.5 rounded-md hover:bg-gray-100 text-gray-600 transition cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div
                  className={`absolute top-[-1] cursor-pointer -left-16 z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-1 animate-fade-in w-max ${
                    !isOwn ? "left-0" : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEmojiPickerOpen(true);
                    }}
                    className={`flex cursor-pointer items-center gap-0.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 px-2 py-1 `}
                  >
                    <Smile size={12} />
                    React
                  </button>

                  {isOwn && (
                    <button
                      onClick={() => {
                        if (msg.id) onDeleteSingle(msg.id);
                        setMenuOpen(false);
                      }}
                      className="flex cursor-pointer items-center gap-0.5 text-xs sm:text-sm text-red-600 hover:text-red-700 px-2 py-1"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* reactions row*/}
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3`}>
        <div className="max-w-[50%]">
          {/* sortedReactionCounts here */}
          {sortedReactionCounts.length > 0 && (
            <div className="flex flex-wrap cursor-pointer gap-0.5 mt-0">
              {sortedReactionCounts.map(([emoji, uids]) => {
                const mine = myUid ? uids.includes(myUid) : false;
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (!msgId || !onReact) return;
                      onReact(msgId, emoji);
                    }}
                    className={`inline-flex items-center cursor-pointer gap-1 px-1 py-1 rounded-full text-sm border shadow-sm
                      ${
                        mine
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-700"
                      }
                    `}
                    aria-label={`React ${emoji} — ${uids.length}`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="text-[11px] opacity-80">
                      {uids.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
