"use client";

import { useUser } from "@/firebase";

export const useAuth = () => {
  const { user, isUserLoading: loading } = useUser();
  if (user === undefined) {
    throw new Error("useAuth must be used within a FirebaseProvider");
  }
  return { user, loading };
};
