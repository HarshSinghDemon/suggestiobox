
import type { Timestamp } from "firebase/firestore";
import type { Subject, Semester } from "./constants";

export type FirebaseUser = {
  uid: string;
  id: string; // id is often used for collection documents
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  year?: '1st' | '2nd' | '3rd';
  role?: 'user' | 'admin';
  publicKey?: string;
  chatRoomIds?: string[];
  friends?: string[];
  friendRequestsSent?: string[];
  friendRequestsReceived?: string[];
  pinnedSuggestions?: string[];
  pinnedAssignments?: string[];
};

export type ChatRoom = {
    id: string;
    participants: string[];
    sessionKey_b64: string;
    lastMessage?: {
        text: string;
        timestamp: Timestamp;
        senderId: string;
    };
    typing?: {
        [key: string]: boolean;
    };
    lastRead?: {
        [key: string]: Timestamp;
    }
    // For displaying participant info in the chat list
    participantDetails?: {
        id: string;
        displayName: string | null;
        photoURL: string | null;
    }[];
};

export type Vote = {
    userId: string;
    type: 'up' | 'down';
}

export type Suggestion = {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  semester: Semester;
  createdAt: Timestamp;
  userId: string;
  userName: string | null;
  userImage: string | null;
  fileUrl?: string;
  fileName?: string;
  path?: string;
  fileType?: string;
  votes?: Vote[];
};

export type Assignment = {
  id: string;
  title: string;
  description?: string;
  subject: Subject;
  semester: Semester;
  createdAt: Timestamp;
  userId: string;
  userName: string | null;
  userImage: string | null;
  fileUrl: string;
  fileName: string;
  path: string;
  fileType: string;
  votes?: Vote[];
};

export type Reaction = {
  emoji: string;
  userId: string;
  userName: string;
}

export type Reply = {
  messageId: string;
  text: string;
  senderName: string;
}

export type Message = {
    id: string;
    roomId: string;
    senderId: string;
    cipherText: string;
    iv: string;
    createdAt: Timestamp;
    reactions?: Reaction[];
    replyTo?: Reply | null;
    // For file attachments
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
};


export type Comment = {
  id: string;
  text: string;
  createdAt: Timestamp;
  userId: string;
  userName: string | null;
  userImage: string | null;
};


export type Notification = {
    id: string;
    recipientId: string; // The user who should receive the notification
    senderId: string;
    senderName: string;
    senderImage: string | null;
    type: 'mention' | 'private_message' | 'friend_request' | 'friend_request_accepted';
    content: string; // e.g., 'mentioned you in a comment'
    relatedId: string; // e.g., the suggestion or messageId
    relatedLink: string; // e.g., /suggestions/suggestionId
    isRead: boolean;
    createdAt: Timestamp;
};

export type GameScore = {
  id: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  score: number;
  createdAt: Timestamp;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  played_at?: string; // This is for recently played
};
