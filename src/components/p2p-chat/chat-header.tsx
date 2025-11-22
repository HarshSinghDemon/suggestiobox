
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { NotificationPanel } from '../layout/notification-panel';
import { Skeleton } from '../ui/skeleton';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2);
};

function SoundwaveIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
            <path d="M4 12V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 10V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 7V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 10V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 12V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M19 14V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function GoldenDot() {
    return (
        <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-amber-400"></span>
            <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-500"></span>
        </span>
    );
}

function NotificationBell() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const previousUnreadCount = useRef(0);
    const isInitialLoad = useRef(true);

    const notificationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'notifications'),
            where('isRead', '==', false)
        );
    }, [user, firestore]);

    const { data: unreadNotifications, isLoading } = useCollection<Notification>(notificationsQuery);
    const unreadCount = unreadNotifications?.length ?? 0;
    
    useEffect(() => {
        if (isLoading) return;
        if (isInitialLoad.current) {
            previousUnreadCount.current = unreadCount;
            isInitialLoad.current = false;
            return;
        }
        if (unreadCount > previousUnreadCount.current) {
            setIsPanelOpen(true);
        }
        previousUnreadCount.current = unreadCount;
    }, [unreadCount, isLoading]);

    return (
        <Popover open={isPanelOpen} onOpenChange={setIsPanelOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-foreground/80" />
                    {unreadCount > 0 && !isLoading && <GoldenDot />}
                    {isLoading && <Skeleton className="absolute top-1 right-1 w-5 h-5 rounded-full" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <NotificationPanel />
            </PopoverContent>
        </Popover>
    )
}


export function ChatHeader() {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    return (
        <header className="flex items-center justify-between h-20 p-6 glass-pane border-b rounded-t-2xl">
            <Link href="/" className="flex items-center gap-2 group">
                <SoundwaveIcon />
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">
                    HyperSpce
                </span>
            </Link>

            <nav className="flex items-center gap-2 p-1 rounded-full bg-background/50">
                <Link href="/messages" prefetch={false}>
                    <Button variant="ghost" size="sm" className={cn("gap-2 rounded-full", pathname.startsWith('/messages') && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground')}>
                        <MessageSquare className="w-4 h-4" />
                        Chat
                    </Button>
                </Link>
                <Link href="/browse" prefetch={false}>
                     <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                        <Briefcase className="w-4 h-4" />
                        Crypto
                    </Button>
                </Link>
            </nav>

            <div className="flex items-center gap-2">
                {loading ? (
                    <Skeleton className="w-10 h-10 rounded-full" />
                ) : user ? (
                    <>
                        <NotificationBell />
                        <Avatar className="w-9 h-9 border-2 border-primary">
                            <AvatarImage src={user.photoURL ?? undefined} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                    </>
                ) : (
                    <Skeleton className="w-24 h-9" />
                )}
            </div>
        </header>
    );
}
