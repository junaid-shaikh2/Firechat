"use client";
import React from "react";
import { ModalProps } from "@/app/types/interface";

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmColor = "bg-red-500 hover:bg-red-600",
}: ModalProps & { confirmText?: string; confirmColor?: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white/90 dark:bg-gray-800 rounded-xl shadow-lg w-80 max-w-[90%] sm:w-80 p-4 flex flex-col gap-2 animate-fade-in">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center break-words">
          {title}
        </h2>

        <p className="text-gray-700 dark:text-gray-300 text-sm text-center break-words">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-3  mt-3 w-auto mx-5 sm:w-auto">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition w-full sm:w-auto cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm rounded-lg text-white transition cursor-pointer w-full sm:w-auto ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
