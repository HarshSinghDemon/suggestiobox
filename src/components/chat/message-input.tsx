

'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, addDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserTagPopover } from './user-tag-popover';
import { moderateText } from '@/ai/flows/moderate-text';

type User = {
  id: string;
  displayName: string;
  photoURL: string;
  email: string;
  year?: '1st' | '2nd' | '3rd';
};

const findMentions = (text: string, users: User[]): { userId: string, userName: string }[] => {
    const mentionRegex = /@(\w+(\s\w+)*)/g;
    let match;
    const mentions = new Set<{ userId: string, userName: string }>();
    
    while((match = mentionRegex.exec(text)) !== null) {
        const mentionedName = match[1];
        const mentionedUser = users.find(u => u.displayName === mentionedName);
        if (mentionedUser) {
            mentions.add({ userId: mentionedUser.id, userName: mentionedUser.displayName });
        }
    }
    
    return Array.from(mentions);
};


export function MessageInput() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const [isTagging, setIsTagging] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCursorPos = useRef(0);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null),
    [firestore]
  );
  
  const { data: users } = useCollection<User>(usersQuery);
  const [currentUserData, setCurrentUserData] = useState<User | undefined>(undefined);

  useEffect(() => {
    if (users && user) {
      setCurrentUserData(users.find(u => u.id === user.uid));
    }
  }, [users, user]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    lastCursorPos.current = cursorPos;

    const wordBeforeCursor = text.substring(0, cursorPos).split(/\s+/).pop() || '';
    if (wordBeforeCursor.startsWith('@')) {
      setIsTagging(true);
      setTagQuery(wordBeforeCursor.substring(1));
    } else {
      setIsTagging(false);
    }
    setMessage(text);
  };
  
  const handleUserSelect = (taggedUser: User) => {
    if (!inputRef.current) return;

    const text = message;
    const cursorPos = lastCursorPos.current;
    
    // Find the start of the @mention
    const start = text.lastIndexOf('@', cursorPos - 1);

    if (start !== -1) {
      const newText =
        text.substring(0, start) +
        `@${taggedUser.displayName} ` +
        text.substring(cursorPos);
        
      setMessage(newText);
      setIsTagging(false);
      
      // Set focus and cursor position after the inserted tag
      setTimeout(() => {
        inputRef.current?.focus();
        const newCursorPos = start + taggedUser.displayName.length + 2;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || message.trim() === '' || !users) return;

    setIsSending(true);
    
    try {
      const moderationResult = await moderateText({ text: message.trim() });
      if (moderationResult.isHarmful) {
          toast({
              variant: 'destructive',
              title: 'Message Blocked',
              description: moderationResult.reason || 'This message violates our community guidelines.',
          });
          setIsSending(false);
          return;
      }
      
      const messagesCol = collection(firestore, 'messages');
      const messageData = {
        text: message.trim(),
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName,
        userImage: user.photoURL,
        userYear: currentUserData?.year || null,
      };

      const messageRef = await addDocumentNonBlocking(messagesCol, messageData);

      // Handle notifications
      const mentions = findMentions(message.trim(), users);
      for (const mention of mentions) {
          if (mention.userId !== user.uid) { // Don't notify self
            const notificationRef = collection(firestore, 'users', mention.userId, 'notifications');
            await addDoc(notificationRef, {
                recipientId: mention.userId,
                senderId: user.uid,
                senderName: user.displayName,
                senderImage: user.photoURL,
                type: 'mention',
                content: `mentioned you in the community chat.`,
                relatedId: messageRef.id,
                relatedLink: '/community-chat',
                isRead: false,
                createdAt: serverTimestamp(),
            });
          }
      }

      setMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Popover open={isTagging} onOpenChange={setIsTagging}>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <PopoverTrigger asChild>
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your message... use @ to mention a user"
                    value={message}
                    onChange={handleInputChange}
                    onKeyUp={(e) => {
                        // This handles cases where the user moves the cursor with arrow keys
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            handleInputChange(e as any);
                        }
                    }}
                    onClick={handleInputChange} // Recalculate tagging state on click
                    disabled={isSending}
                    autoComplete="off"
                    id="message-input"
                />
            </PopoverTrigger>
            <Button type="submit" size="icon" disabled={isSending || message.trim() === ''}>
                {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                <Send className="w-4 h-4" />
                )}
                <span className="sr-only">Send Message</span>
            </Button>
        </form>
        <PopoverContent 
            className="w-[350px] p-0" 
            onOpenAutoFocus={(e) => e.preventDefault()} // prevent focus stealing
            side="top" 
            align="start"
        >
            <UserTagPopover onSelect={handleUserSelect} searchQuery={tagQuery} />
        </PopoverContent>
    </Popover>
  );
}
