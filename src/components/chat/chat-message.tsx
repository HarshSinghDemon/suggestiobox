
'use client';

import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useUser, useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type ChatMessageProps = {
  message: Message;
};

const MentionedUser = ({ text }: { text: string }) => (
    <span className="px-1 py-0.5 font-semibold rounded-sm bg-primary/20 text-primary">
        {text}
    </span>
);

const renderMessageWithMentions = (text: string) => {
    const mentionRegex = /@(\w+(\s\w+)*)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
        if (index % 3 === 1) { // This will be the captured username
            return <MentionedUser key={index} text={`@${part}`} />;
        }
        return part;
    });
};


export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2);
  };
  
  const timeAgo = message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'just now';

  const canDelete = user?.uid === message.userId;

  const handleDelete = () => {
    if (!firestore || !canDelete) return;
    const messageRef = doc(firestore, 'messages', message.id);
    deleteDocumentNonBlocking(messageRef);
  };
  
  const yearBadgeClass = cn({
    'border-sky-500/30 bg-sky-500/20 text-sky-400': message.userYear === '1st',
    'border-amber-500/30 bg-amber-500/20 text-amber-400': message.userYear === '2nd',
    'border-emerald-500/30 bg-emerald-500/20 text-emerald-400': message.userYear === '3rd',
  });

  return (
    <div className="flex items-start gap-4 group">
      <Avatar className="w-10 h-10 border">
        <AvatarImage src={message.userImage ?? undefined} />
        <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{message.userName || 'Anonymous'}</p>
          {message.userYear && <Badge variant="outline" className={yearBadgeClass}>{message.userYear} Year</Badge>}
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <p className="text-foreground/90">{renderMessageWithMentions(message.text)}</p>
      </div>
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your message.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
