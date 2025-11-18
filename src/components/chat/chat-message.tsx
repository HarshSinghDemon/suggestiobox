'use client';

import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2);
  };
  
  const timeAgo = message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : 'just now';

  return (
    <div className="flex items-start gap-4">
      <Avatar className="w-10 h-10 border">
        <AvatarImage src={message.userImage ?? undefined} />
        <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{message.userName || 'Anonymous'}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <p className="text-foreground/90">{message.text}</p>
      </div>
    </div>
  );
}
