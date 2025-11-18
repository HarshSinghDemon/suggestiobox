'use client';

import { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { FirebaseUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        <div className="w-full h-screen flex flex-col">
            <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
                <Skeleton className="h-8 w-40" />
                <div className="flex items-center w-full gap-4 ml-auto md:ml-0 md:gap-2 lg:gap-4">
                    <Skeleton className="h-8 w-24 ml-auto" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </header>
            <div className="flex-1 p-6">
                <Skeleton className="w-full h-full" />
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
