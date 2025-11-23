
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, runTransaction, increment } from 'firebase/firestore';
import type { Suggestion, FirebaseUser } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Eye, Trash2, AlertCircle, Pin, PinOff, BrainCircuit, Coins } from 'lucide-react';
import { FileIcon } from '@/components/browse/file-icon';
import { SubjectIcon } from '@/components/browse/subject-icon';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { deleteFileFromSupabase } from '@/lib/supabase/storage';
import { CommentSection } from './comment-section';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { StudyBuddy } from '../ai/study-buddy';
import { useState } from 'react';
import { Input } from '../ui/input';

function SuggestionDetailsSkeleton() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/4 h-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-40" />
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <Skeleton className="w-1/2 h-8" />
        <Skeleton className="w-full h-12" />
      </CardFooter>
    </Card>
  );
}

type SuggestionDetailsProps = {
  suggestionId: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export function SuggestionDetails({ suggestionId, supabaseUrl, supabaseAnonKey }: SuggestionDetailsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState<number | string>("");

  const suggestionRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'suggestions', suggestionId) : null),
    [firestore, suggestionId]
  );
  
  const { data: suggestion, isLoading } = useDoc<Suggestion>(suggestionRef);
  
  const userProfileRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<FirebaseUser>(userProfileRef);

  const isOwner = user && suggestion && user.uid === suggestion.userId;
  const canDeleteFile = !!(supabaseUrl && supabaseAnonKey);

  const totalInvestment = suggestion?.investments?.reduce((acc, inv) => acc + inv.amount, 0) ?? 0;
  const userInvestment = suggestion?.investments?.find(inv => inv.userId === user?.uid)?.amount ?? 0;
  const isPinned = userProfile?.pinnedSuggestions?.includes(suggestionId);
  
  const handleInvestment = async () => {
    if (!user || !firestore || !suggestionRef || !userProfileRef) return;
    const amount = Number(investmentAmount);

    if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a positive number.' });
        return;
    }
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userProfileRef);
            const suggestionDoc = await transaction.get(suggestionRef);

            if (!userDoc.exists() || !suggestionDoc.exists()) {
                throw new Error("User or Suggestion not found.");
            }

            const currentUserCoins = userDoc.data()?.coins ?? 0;
            if (currentUserCoins < amount) {
                throw new Error("You don't have enough coins to make this investment.");
            }

            const newInvestments = (suggestionDoc.data().investments || []).filter((inv: any) => inv.userId !== user.uid);
            newInvestments.push({ userId: user.uid, amount: (userInvestment + amount) });

            transaction.update(userProfileRef, { coins: increment(-amount) });
            transaction.update(suggestionRef, { investments: newInvestments });
        });
        toast({ title: 'Investment Successful!', description: `You invested ${amount} coins.` });
        setInvestmentAmount("");
    } catch (error: any) {
        console.error("Investment failed:", error);
        toast({ variant: 'destructive', title: 'Investment Failed', description: error.message });
    }
  }


  const handlePin = async () => {
    if (!user || !userProfileRef) return;
    const updateData = isPinned
        ? { pinnedSuggestions: arrayRemove(suggestionId) }
        : { pinnedSuggestions: arrayUnion(suggestionId) };

    await updateDoc(userProfileRef, updateData);
    toast({
        title: isPinned ? 'Unpinned!' : 'Pinned!',
        description: `This suggestion has been ${isPinned ? 'removed from' : 'added to'} your pinned items.`,
    });
  }


  const handleDelete = async () => {
    if (!firestore || !suggestion) return;
    
    try {
      if(suggestion.path && canDeleteFile) {
        await deleteFileFromSupabase(suggestion.path, supabaseUrl!, supabaseAnonKey!);
      }
      await deleteDoc(suggestionRef!);
      toast({
        title: 'Success!',
        description: 'Suggestion deleted successfully.'
      });
      router.push('/browse?tab=suggestions');
    } catch (error) {
      console.error("Deletion failed:", error);
      toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete the suggestion. Please try again.',
      });
    }
  };

  if (isLoading) {
    return <SuggestionDetailsSkeleton />;
  }

  if (!suggestion) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">Suggestion not found.</p>
        <Button asChild variant="link">
          <Link href="/browse">Go back to browse</Link>
        </Button>
      </div>
    );
  }
  
  const date = suggestion.createdAt ? suggestion.createdAt.toDate().toLocaleDateString() : 'N/A';

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/browse?tab=suggestions" prefetch={true}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Suggestions
            </Link>
          </Button>
           <div className="flex items-center gap-2">
            <StudyBuddy contentToAnalyze={suggestion.description} fileUrl={suggestion.fileUrl}/>
            {isOwner && (
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your suggestion and its associated file if it exists.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Confirm Deletion
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            )}
            <Badge variant="secondary">{suggestion.subject}</Badge>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <SubjectIcon subject={suggestion.subject} className="w-10 h-10 mt-1 text-primary" />
          <div className='flex-1'>
            <CardTitle className="text-3xl">{suggestion.title}</CardTitle>
            <CardDescription className="mt-2 text-sm">
              Submitted by {suggestion.userName || 'Anonymous'} on {date}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
         {isOwner && suggestion.path && !canDeleteFile && (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Configuration Warning</AlertTitle>
                <AlertDescription>
                    Supabase is not configured. File deletion will not work if you delete this item.
                </AlertDescription>
            </Alert>
        )}
        <p className="whitespace-pre-wrap text-base text-foreground/90">{suggestion.description}</p>
        {suggestion.fileUrl && suggestion.fileName && (
            <div className="flex items-center justify-between w-full p-4 mt-6 rounded-lg bg-muted">
                <div className="flex items-center gap-4">
                <FileIcon fileType={suggestion.fileType} className="w-6 h-6" />
                <span className="font-medium">{suggestion.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                    <a href={suggestion.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                    </a>
                </Button>
                <Button asChild size="sm">
                    <a href={suggestion.fileUrl} download={suggestion.fileName}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                    </a>
                </Button>
                </div>
            </div>
        )}
        
        <div className="pt-6 mt-6 border-t">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-lg font-semibold">Idea Stock</h4>
              <p className="text-sm text-muted-foreground">Total coins invested in this idea.</p>
               <div className="flex items-center gap-2 mt-2 text-2xl font-bold text-primary">
                <Coins className="w-6 h-6" />
                <span>{totalInvestment.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted md:w-1/2">
                <div className="flex items-center justify-between text-sm">
                    <span>Your Coins: <span className="font-bold text-amber-400">{userProfile?.coins?.toLocaleString() ?? 0}</span></span>
                    <span>Your Investment: <span className="font-bold text-green-400">{userInvestment.toLocaleString()}</span></span>
                </div>
                 <div className="flex gap-2">
                    <Input 
                        type="number" 
                        placeholder="Amount" 
                        min="1"
                        value={investmentAmount}
                        onChange={e => setInvestmentAmount(e.target.value)}
                        disabled={!user}
                    />
                    <Button onClick={handleInvestment} disabled={!user || !investmentAmount}>
                        Pledge Coins
                    </Button>
                 </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handlePin} disabled={!user} className="mt-4">
              {isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
              {isPinned ? 'Unpin' : 'Pin'}
          </Button>
        </div>

        <CommentSection collectionPath={['suggestions', suggestionId, 'comments']} />
      </CardContent>
    </Card>
  );
}
