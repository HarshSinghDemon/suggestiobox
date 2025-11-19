
import type { Timestamp } from "firebase/firestore";
import type { Subject, Semester } from "./constants";

export type FirebaseUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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
  type: 'mention';
  content: string; // e.g., 'mentioned you in a message'
  relatedId: string; // e.g., the messageId
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
