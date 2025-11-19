'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Music } from 'lucide-react';
import Link from 'next/link';

export default function RequestMusicPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [songName, setSongName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || songName.trim() === '') return;

    setIsSubmitting(true);
    try {
      const requestsCollection = collection(firestore, 'musicRequests');
      await addDocumentNonBlocking(requestsCollection, {
        userId: user.uid,
        userName: user.displayName,
        songName: songName.trim(),
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Request Submitted!',
        description: `Thanks for suggesting "${songName.trim()}".`,
      });
      setSongName('');
    } catch (error) {
      console.error('Error submitting music request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit your request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              You need to be logged in to request a song.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Music className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Request a Song</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Have a favorite track you'd like to hear? Let us know!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="Enter song name and artist..."
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              disabled={isSubmitting}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting || songName.trim() === ''}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
