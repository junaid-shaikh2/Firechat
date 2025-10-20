import type React from "react";
import type { Timestamp } from "firebase/firestore";


export interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Timestamp | Date | null;
  typingTo?: string;
  isTyping?: boolean;
}

export interface ChatHeaderProps {
  user: User;
  onLogout?: () => void;
  onBack?: () => void;
  className?: string;
  currentUser: User;
}

export interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  showDate?: boolean;
  onSelect?: (msgId: string) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onDeleteSingle?: (msgId: string) => void;
  onReact?: (msgId: string, emoji: string) => void;
  currentUser?: User;
}

export interface Message {
  id?: string;
  from: string;
  to: string;
  text?: string;
  timestamp: Date | { seconds: number; nanoseconds: number };
  image?: string;
  audio?: string;
  reactions?: Record<string, string[]>;
  status?: "sent" | "delivered" | "read";
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export interface ChatWindowProps {
  currentUser: User;
  messages: Message[];
  newMessage: string;
  setNewMessage: (val: string) => void;
  setImage: (val: File | null) => void;
  onSendMessage: () => void;
  image: File | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  audioBlob: Blob | null;
  setAudioBlob: (val: Blob | null) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  onReact?: (msgId: string, emoji: string) => void;
  onTyping?: (text: string) => void;  

}

export interface SidebarProps {
  users: User[];
  filteredUsers: User[];
  searchTerm: string;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  user: User;
  lastMessage?: Message;
}
