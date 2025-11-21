
'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BellRing, BellOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function NotificationSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
};

export function NotificationPanel() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const notificationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const handleNotificationClick = async (notification: Notification) => {
        if (!user || !firestore) return;
        
        router.push(notification.relatedLink);

        if (!notification.isRead) {
            const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
            try {
                await updateDoc(notifRef, { isRead: true });
            } catch(e) {
                console.error("Failed to mark notification as read", e);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not update notification status.'
                })
            }
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <BellRing className="w-5 h-5" />
                    Notifications
                </h3>
            </div>
            {isLoading ? (
                <NotificationSkeleton />
            ) : notifications && notifications.length > 0 ? (
                <ScrollArea className="flex-1 h-80">
                    <div className="p-2 space-y-1">
                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-accent",
                                    !notif.isRead && "bg-primary/10"
                                )}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <Avatar className="w-10 h-10 mt-1">
                                    <AvatarImage src={notif.senderImage ?? undefined} />
                                    <AvatarFallback>{getInitials(notif.senderName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <span className="font-semibold">{notif.senderName}</span> {notif.content}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                                    </p>
                                </div>
                                {!notif.isRead && <div className="w-2 h-2 mt-2 rounded-full bg-primary animate-pulse" />}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 h-full p-8 text-center text-muted-foreground">
                    <BellOff className="w-12 h-12 mb-2" />
                    <p className="text-sm">No new notifications.</p>
                </div>
            )}
        </div>
    );
}

