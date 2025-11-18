'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MessageInput() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

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
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isSending}
        autoComplete="off"
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
  );
}
