

import type { Timestamp } from "firebase/firestore";
import type { Subject, Semester } from "./constants";

export type FirebaseUser = {
  uid: string;
  id: string; // id is often used for collection documents
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  lastSeen?: Timestamp;
  year?: '1st' | '2nd' | '3rd';
  role?: 'user' | 'admin';
  publicKey?: string;
  chatRoomIds?: string[];
  groupChatRoomIds?: string[];
  friends?: string[];
  friendRequestsSent?: string[];
  friendRequestsReceived?: string[];
  pinnedSuggestions?: string[];
  pinnedAssignments?: string[];
  coins?: number;
};

export type ChatRoom = {
    id: string;
    participants: string[];
    createdAt: Timestamp;
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
    isUnread?: boolean;
};

export type GroupChatRoom = {
    id: string;
    name: string;
    description?: string;
    photoURL?: string;
    participants: string[];
    admins: string[];
    createdBy: string;
    createdAt: Timestamp;
    lastMessage?: {
        text: string;
        timestamp: Timestamp;
        senderId: string;
        senderName: string;
    };
    isUnread?: boolean;
}

export type Investment = {
    userId: string;
    amount: number;
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
  investments?: Investment[];
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
  investments?: Investment[];
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

export type QuizQuestion = {
    question: string;
    options: string[];
    correctAnswer: string;
    time: number;
};


export type QuizLobby = {
    id: string;
    joinCode: string;
    hostId: string;
    status: 'waiting' | 'active' | 'finished';
    createdAt: Timestamp;
    players: {
        id: string;
        displayName: string;
        photoURL?: string;
        score: number;
    }[];
    questions?: QuizQuestion[];
    currentQuestionIndex?: number;
    questionStartTime?: Timestamp;
};

export type ScribbleRoom = {
    id: string;
    joinCode: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: Timestamp;
    players: {
        id: string;
        displayName: string;
        photoURL?: string;
        score: number;
    }[];
    currentDrawerId?: string;
    currentWord?: string;
    drawingData?: string;
};

export type ImposterLobby = {
    id: string;
    joinCode: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: Timestamp;
    players: {
        id: string;
        displayName: string;
        photoURL?: string;
        isAlive: boolean;
    }[];
    roles: Record<string, 'hero' | 'saboteur'>;
};

export type SpyfallLobby = {
    id: string;
    joinCode: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: Timestamp;
    players: {
        id: string;
        displayName: string;
        photoURL?: string;
    }[];
};

export type SpyGridLobby = {
    id: string;
    joinCode: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: Timestamp;
    players: {
        id: string;
        displayName: string;
        photoURL?: string;
    }[];
};

export type SketchLobby = {
    id: string;
    joinCode: string;
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: Timestamp;
    players: {
        id: string;
        displayName: string;
        photoURL?: string;
    }[];
};
