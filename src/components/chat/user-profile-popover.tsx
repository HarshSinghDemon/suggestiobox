
'use client';

import { FirebaseUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, ShieldCheck, Star, Loader2, UserPlus, UserCheck, UserX, Check, X, KeyRound, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { findOrCreateChat } from '@/lib/chat';
import { doc } from 'firebase/firestore';
import { sendFriendRequest, cancelFriendRequest, acceptFriendRequest, declineFriendRequest } from '@/lib/friends';

interface UserProfilePopoverProps {
  user: FirebaseUser;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
};

const YearBadge = ({ year }: { year: '1st' | '2nd' | '3rd' | undefined }) => {
  if (!year) return null;

  switch (year) {
    case '1st':
      return (
        <Badge className="border-transparent bg-gradient-to-r from-green-400/30 to-blue-500/30 text-green-300 transition-all hover:shadow-green-500/20 hover:scale-105">
          <Star className="w-3 h-3 mr-1" />
          Junior
        </Badge>
      );
    case '2nd':
      return (
        <Badge className="border-transparent bg-gradient-to-r from-amber-400/30 to-orange-500/30 text-amber-300 animate-pulse-slow transition-all hover:shadow-amber-500/20 hover:scale-105">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Senior
        </Badge>
      );
    case '3rd':
      return (
        <Badge className="border-transparent animate-super-senior-shine text-purple-200 transition-all hover:shadow-purple-400/30 hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2L9 9l-7 2.5 7 2.5 3 6.5 3-6.5 7-2.5-7-2.5L12 2z"/><path d="M18 9l-2.25 4.75L12 15l-3.75-1.25L6 9"/><path d="M12 15l3 6.5 3-6.5"/></svg>
          Super Senior
        </Badge>
      );
    default:
      return null;
  }
};


function ActionButtons({ otherUser }: { otherUser: FirebaseUser }) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const currentUserDocRef = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return doc(firestore, 'users', currentUser.uid);
    }, [currentUser, firestore]);
    const { data: currentUserData } = useDoc<FirebaseUser>(currentUserDocRef);
    
    if (!currentUser || !currentUserData || !otherUser || currentUser.uid === otherUser.id) {
        return null; // Don't show buttons on own profile or if data is missing
    }

    const isFriend = currentUserData.friends?.includes(otherUser.id);
    const requestSent = currentUserData.friendRequestsSent?.includes(otherUser.id);
    const requestReceived = currentUserData.friendRequestsReceived?.includes(otherUser.id);

    const handleStartChat = async () => {
        setIsLoading(true);
        try {
            const roomId = await findOrCreateChat(firestore, currentUser.uid, otherUser.id);
            router.push(`/messages/${roomId}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not start chat.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddFriend = async () => {
        setIsLoading(true);
        try {
            await sendFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Sent!", description: `Friend request sent to ${otherUser.displayName}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCancelRequest = async () => {
        setIsLoading(true);
        try {
            await cancelFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Canceled", description: `Your friend request to ${otherUser.displayName} was canceled.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleAcceptRequest = async () => {
        setIsLoading(true);
        try {
            await acceptFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Friend Added!", description: `You are now friends with ${otherUser.displayName}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }

    const handleDeclineRequest = async () => {
        setIsLoading(true);
        try {
            await declineFriendRequest(firestore, currentUser.uid, otherUser.id);
            toast({ title: "Request Declined", description: `Friend request from ${otherUser.displayName} declined.`});
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }
    
    if (isFriend || currentUserData.role === 'admin') {
        return (
            <Button className="w-full mt-2" onClick={handleStartChat} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Chat
            </Button>
        );
    }
    
    if (requestReceived) {
        return (
            <div className="flex w-full gap-2 mt-2">
                <Button className="flex-1" onClick={handleAcceptRequest} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Accept
                </Button>
                 <Button className="flex-1" variant="outline" onClick={handleDeclineRequest} disabled={isLoading}>
                    <X className="w-4 h-4 mr-2"/> Decline
                </Button>
            </div>
        )
    }
    
    if (requestSent) {
        return (
             <div className='flex flex-col w-full gap-2 mt-2'>
                <Button variant="secondary" disabled>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Request Sent
                </Button>
                 <Button variant="link" size="sm" onClick={handleCancelRequest} disabled={isLoading}>
                    Cancel Request
                </Button>
            </div>
        );
    }
    
    return (
        <Button className="w-full mt-2" onClick={handleAddFriend} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Add Friend
        </Button>
    )

}

export function UserProfilePopover({ user: otherUser }: UserProfilePopoverProps) {
  const { toast } = useToast();
  if (!otherUser) return null;

  const displayKey = otherUser.publicKey || 'BwEaRml...key_not_found';
  
  const copyKeyToClipboard = () => {
    if (displayKey) {
        navigator.clipboard.writeText(displayKey);
        toast({
            title: "Public Key Copied!",
            description: "The user's public key for E2EE has been copied.",
        });
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Avatar className="w-24 h-24 border-4 border-primary/50">
        <AvatarImage src={otherUser.photoURL ?? undefined} alt={otherUser.displayName ?? 'User Avatar'} />
        <AvatarFallback className="text-3xl">{getInitials(otherUser.displayName)}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="text-lg font-semibold">{otherUser.displayName}</h3>
        <div className="mt-1">
          <YearBadge year={otherUser.year} />
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="w-4 h-4" />
        <a href={`mailto:${otherUser.email}`} className="hover:underline">
            {otherUser.email}
        </a>
      </div>
      
       <div className='w-full p-3 mt-2 space-y-2 text-left border rounded-md bg-muted/50'>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="w-4 h-4" />
              Encryption Key
          </h4>
          <div className="flex items-center gap-2 p-2 break-all border rounded-md bg-background">
              <p className="flex-1 font-mono text-xs text-muted-foreground">{displayKey}</p>
              <Button variant="ghost" size="icon" className="shrink-0 w-7 h-7" onClick={copyKeyToClipboard}>
                  <Copy className="w-3.5 h-3.5" />
              </Button>
          </div>
      </div>

      <ActionButtons otherUser={otherUser} />
    </div>
  );
}
