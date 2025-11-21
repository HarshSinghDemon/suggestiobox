

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
  publicKey?: string; // Stored in Base64
  chatRoomIds?: string[];
  friends?: string[];
  friendRequestsSent?: string[];
  friendRequestsReceived?: string[];
};

export type ChatRoom = {
    id: string;
    participants: string[];
    lastMessage?: {
        text: string; // This might be ciphertext for the last message preview
        timestamp: Timestamp;
    };
    // For displaying participant info in the chat list
    participantDetails?: {
        id: string;
        displayName: string | null;
        photoURL: string | null;
    }[];
};


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
};

export type Assignment = {
  id: string;
  title: string;
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
};

export type Message = {
  id: string;
  roomId: string;
  senderId: string;
  cipherText: string; // Base64 encoded ciphertext
  iv: string; // Base64 encoded Initialization Vector
  createdAt: Timestamp;
  // Denormalized data for display
  userName?: string | null;
  userImage?: string | null;
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
    type: 'mention' | 'private_message';
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
    

    
