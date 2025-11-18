import type { Timestamp } from "firebase/firestore";
import type { Subject } from "./constants";

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
