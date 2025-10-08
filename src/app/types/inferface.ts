
export interface User {
  uid: string;
  name?: string;
  email?: string;
}

export interface ChatHeaderProps {
  user: User;
}


export interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  showDate?: boolean;
}


export interface Message {
  id?: string;
  from: string;
  to: string;
  text: string;
  timestamp: any;
}

// export interface ChatWindowProps {
//   name?: string | undefined;
// }


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
  onSendMessage: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export interface SidebarProps {
  users: User[];
  filteredUsers: User[];
  searchTerm: string;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
}
