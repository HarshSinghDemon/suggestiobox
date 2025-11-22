
'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BellRing, BellOff, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { acceptFriendRequest, declineFriendRequest } from '@/lib/friends';
import { useState } from 'react';

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
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

    const notificationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const markAsRead = async (notificationId: string) => {
        if (!user || !firestore) return;
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
        try {
            await updateDoc(notifRef, { isRead: true });
        } catch (e) {
            console.error("Failed to mark notification as read", e);
        }
    };
    
    const scheduleDeletion = (notificationId: string) => {
        setTimeout(async () => {
            if (!user || !firestore) return;
            const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
            try {
                await deleteDoc(notifRef);
            } catch (e) {
                // Fail silently, as this is a background task.
                console.error("Failed to auto-delete notification:", e);
            }
        }, 5 * 60 * 1000); // 5 minutes
    };
    
    const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation(); // Prevent the main click handler from firing
        if (!user || !firestore) return;
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
        try {
            await deleteDoc(notifRef);
            toast({ title: "Notification Removed" });
        } catch (error) {
            console.error("Failed to delete notification:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not remove notification." });
        }
    };


    const handleAccept = async (notification: Notification) => {
        if (!user || !firestore) return;
        setProcessingRequestId(notification.id);
        try {
            await acceptFriendRequest(firestore, user.uid, notification.senderId);
            await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', notification.id));
            toast({ title: "Friend Added!", description: `You are now friends with ${notification.senderName}.`});
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setProcessingRequestId(null);
        }
    }

    const handleDecline = async (notification: Notification) => {
        if (!user || !firestore) return;
        setProcessingRequestId(notification.id);
        try {
            await declineFriendRequest(firestore, user.uid, notification.senderId);
            await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', notification.id));
            toast({ title: "Request Declined", description: `Friend request from ${notification.senderName} declined.`});
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setProcessingRequestId(null);
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        // Friend requests are handled by buttons, not by clicking the whole notification
        if (notification.type === 'friend_request') return;
        
        router.push(notification.relatedLink);

        if (!notification.isRead) {
            await markAsRead(notification.id);
            scheduleDeletion(notification.id);
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
                                    "flex flex-col gap-3 p-2 rounded-md group relative",
                                    notif.type !== 'friend_request' && "cursor-pointer hover:bg-accent",
                                    !notif.isRead && "bg-primary/10"
                                )}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDeleteNotification(e, notif.id)}>
                                    <X className="w-4 h-4" />
                                </Button>

                               <div className='flex items-start gap-3'>
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
                               {notif.type === 'friend_request' && !notif.isRead && (
                                   <div className="flex justify-end gap-2">
                                       <Button size="sm" onClick={() => handleAccept(notif)} disabled={processingRequestId === notif.id}>
                                           <Check className="w-4 h-4 mr-2"/> Accept
                                       </Button>
                                       <Button size="sm" variant="outline" onClick={() => handleDecline(notif)} disabled={processingRequestId === notif.id}>
                                           <X className="w-4 h-4 mr-2"/> Decline
                                       </Button>
                                   </div>
                               )}
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
