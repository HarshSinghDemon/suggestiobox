
'use client';

import { FirebaseUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, ShieldCheck, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { findOrCreateChat } from '@/lib/chat';

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


export function UserProfilePopover({ user: otherUser }: UserProfilePopoverProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    if (!currentUser || !firestore) return;
    setIsLoading(true);
    try {
        const roomId = await findOrCreateChat(firestore, currentUser.uid, otherUser.id);
        router.push(`/messages/${roomId}`);
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not start chat.' });
    } finally {
        setIsLoading(false);
    }
  };

  if (!otherUser) return null;
  
  const isOwnProfile = currentUser?.uid === otherUser.id;

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
      
      {!isOwnProfile && (
        <Button className="w-full mt-2" onClick={handleStartChat} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
          Chat
        </Button>
      )}
    </div>
  );
}
