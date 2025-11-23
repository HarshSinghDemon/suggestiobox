
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { FirebaseUser } from '@/lib/types';
import { collection, query, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};


export function FloatingAvatars() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), limit(20));
    }, [firestore]);

    const { data: users, isLoading } = useCollection<FirebaseUser>(usersQuery);
    
    const randomUsers = useMemo(() => {
        if (!users) return [];
        return users.sort(() => 0.5 - Math.random()).slice(0, 15);
    }, [users]);
    
    if (isLoading) return null;

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {randomUsers.map((user, i) => {
                const size = Math.random() * (80 - 40) + 40;
                const animationDuration = Math.random() * (40 - 20) + 20;
                const animationDelay = Math.random() * 20;
                const position = {
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                };
                const animationName = i % 2 === 0 ? 'float' : 'float-reverse';

                return (
                    <div
                        key={user.id}
                        className="absolute rounded-full animate-fade-in"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            top: position.top,
                            left: position.left,
                            animationName: animationName,
                            animationDuration: `${animationDuration}s`,
                            animationDelay: `${animationDelay}s`,
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                        }}
                    >
                         <div className="relative w-full h-full transition-all duration-300 transform rounded-full opacity-30 hover:opacity-60 hover:scale-110">
                            <Avatar className="w-full h-full border-2 border-primary/50 shadow-lg shadow-primary/20">
                                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User avatar'} />
                                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
