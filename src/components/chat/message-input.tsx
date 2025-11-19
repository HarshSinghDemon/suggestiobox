'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserTagPopover } from './user-tag-popover';

type User = {
  id: string;
  displayName: string;
  photoURL: string;
  email: string;
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
    if (!user || !firestore || message.trim() === '') return;

    setIsSending(true);
    
    try {
      const messagesCol = collection(firestore, 'messages');
      const messageData = {
        text: message.trim(),
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName,
        userImage: user.photoURL,
      };

      await addDocumentNonBlocking(messagesCol, messageData);
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
        <PopoverTrigger asChild>
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your message... use @ to mention a user"
                    value={message}
                    onChange={handleInputChange}
                    onClick={handleInputChange} // To handle cursor changes
                    onKeyUp={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            handleInputChange(e as any);
                        }
                    }}
                    disabled={isSending}
                    autoComplete="off"
                    id="message-input"
                />
                <Button type="submit" size="icon" disabled={isSending || message.trim() === ''}>
                    {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                    <Send className="w-4 h-4" />
                    )}
                    <span className="sr-only">Send Message</span>
                </Button>
            </form>
        </PopoverTrigger>
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
