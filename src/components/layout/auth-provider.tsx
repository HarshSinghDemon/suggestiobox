'use client';

import { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase/config';
import type { FirebaseUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// It's important to get the auth instance only on the client.
const auth = getAuth(app);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const { uid, email, displayName, photoURL } = firebaseUser;
        setUser({ uid, email, displayName, photoURL });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="w-full h-screen flex flex-col bg-background">
            <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6 border-white/10">
                <Skeleton className="w-40 h-8 bg-white/10" />
                <div className="flex items-center w-full gap-4 ml-auto md:ml-0 md:gap-2 lg:gap-4">
                    <Skeleton className="w-24 h-8 ml-auto bg-white/10" />
                    <Skeleton className="w-8 h-8 rounded-full bg-white/10" />
                </div>
            </header>
            <div className="flex-1 p-6">
                <Skeleton className="w-full h-full bg-white/10" />
            </div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
