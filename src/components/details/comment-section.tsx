
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Comment, FirebaseUser as User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { moderateText } from '@/ai/flows/moderate-text';
import { useRouter } from 'next/navigation';

interface CommentSectionProps {
  collectionPath: string[];
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
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


function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-start gap-4">
      <Avatar className="w-10 h-10 border">
        <AvatarImage src={comment.userImage ?? undefined} />
        <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{comment.userName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
          </p>
        </div>
        <p className="mt-1 text-foreground/90">{comment.text}</p>
      </div>
    </div>
  );
}

export function CommentSection({ collectionPath }: CommentSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null),
    [firestore]
  );
  const { data: users } = useCollection<User>(usersQuery);

  const commentsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      const [collectionName, docId, subcollectionName] = collectionPath;
      if (!collectionName || !docId || !subcollectionName) return null;
      
      return query(
        collection(firestore, collectionName, docId, subcollectionName),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, collectionPath]
  );
  
  const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !commentText.trim() || !users) return;

    setIsSubmitting(true);
    
    try {
      const moderationResult = await moderateText({ text: commentText.trim() });
      if (moderationResult.isHarmful) {
        toast({
          variant: 'destructive',
          title: 'Comment Blocked',
          description: moderationResult.reason || 'This comment violates community guidelines.',
        });
        setIsSubmitting(false);
        return;
      }
      
      const [collectionName, docId, subcollectionName] = collectionPath;
      const commentsColRef = collection(firestore, collectionName, docId, subcollectionName);

      const commentRef = await addDoc(commentsColRef, {
        text: commentText.trim(),
        userId: user.uid,
        userName: user.displayName,
        userImage: user.photoURL,
        createdAt: serverTimestamp(),
      });
      
      const mentions = findMentions(commentText.trim(), users);
      for (const mention of mentions) {
          if (mention.userId !== user.uid) { // Don't notify self
            const notificationRef = collection(firestore, 'users', mention.userId, 'notifications');
            await addDoc(notificationRef, {
                recipientId: mention.userId,
                senderId: user.uid,
                senderName: user.displayName,
                senderImage: user.photoURL,
                type: 'mention',
                content: `mentioned you in a comment.`,
                relatedId: docId,
                relatedLink: `/${collectionName}/${docId}`,
                isRead: false,
                createdAt: serverTimestamp(),
            });
          }
      }

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not post your comment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-8 mt-8 border-t">
      <h3 className="mb-6 text-2xl font-semibold">Comments</h3>
      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
            <div className='flex gap-4'>
                <Avatar className="w-10 h-10 border">
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a public comment... use @ to mention"
                    disabled={isSubmitting}
                />
            </div>
          <Button type="submit" disabled={isSubmitting || !commentText.trim()} className='self-end'>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Comment
          </Button>
        </form>
      ) : (
        <p className="mb-8 text-center text-muted-foreground">
            You must be logged in to comment. <Button variant="link" className="p-0" onClick={() => router.push('/login')}>Login now</Button>
        </p>
      )}

      <div className="space-y-6">
        {isLoading && <p>Loading comments...</p>}
        {comments && comments.length > 0 ? (
          comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
        ) : !isLoading ? (
          <p className="text-center text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : null}
      </div>
    </div>
  );
}
