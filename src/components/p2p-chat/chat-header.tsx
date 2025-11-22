
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, LogOut, Search, Edit } from 'lucide-react';
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


export function ChatHeader({ children }: { children?: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    return (
        <header className="flex flex-col h-auto p-4 shrink-0">
            <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-2xl font-bold">
                        Chats
                    </span>
                </Link>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                        <Search className="w-5 h-5" />
                    </Button>
                    {children}
                </div>
            </div>
        </header>
    );
}
