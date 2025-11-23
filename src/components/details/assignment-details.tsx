
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, deleteDoc, updateDoc, increment, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import type { Assignment, FirebaseUser } from '@/lib/types';
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
import { Download, ArrowLeft, Eye, Trash2, AlertCircle, Pin, PinOff, Coins } from 'lucide-react';
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
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { StudyBuddy } from '../ai/study-buddy';
import { useState } from 'react';
import { Input } from '../ui/input';

function AssignmentDetailsSkeleton() {
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

type AssignmentDetailsProps = {
  assignmentId: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export function AssignmentDetails({ assignmentId, supabaseUrl, supabaseAnonKey }: AssignmentDetailsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState<number | string>("");

  const assignmentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'assignments', assignmentId) : null),
    [firestore, assignmentId]
  );
  
  const { data: assignment, isLoading } = useDoc<Assignment>(assignmentRef);
  
  const userProfileRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<FirebaseUser>(userProfileRef);

  const isOwner = user && assignment && user.uid === assignment.userId;
  const canDeleteFile = !!(supabaseUrl && supabaseAnonKey);
  
  const totalInvestment = assignment?.investments?.reduce((acc, inv) => acc + inv.amount, 0) ?? 0;
  const userInvestment = assignment?.investments?.find(inv => inv.userId === user?.uid)?.amount ?? 0;
  const isPinned = userProfile?.pinnedAssignments?.includes(assignmentId);
  
  const handleInvestment = async () => {
    if (!user || !firestore || !assignmentRef || !userProfileRef) return;
    const amount = Number(investmentAmount);

    if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a positive number.' });
        return;
    }
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userProfileRef);
            const assignmentDoc = await transaction.get(assignmentRef);

            if (!userDoc.exists() || !assignmentDoc.exists()) {
                throw new Error("User or Assignment not found.");
            }

            const currentUserCoins = userDoc.data()?.coins ?? 0;
            if (currentUserCoins < amount) {
                throw new Error("You don't have enough coins to make this investment.");
            }

            const newInvestments = (assignmentDoc.data().investments || []).filter((inv: any) => inv.userId !== user.uid);
            newInvestments.push({ userId: user.uid, amount: (userInvestment + amount) });

            transaction.update(userProfileRef, { coins: increment(-amount) });
            transaction.update(assignmentRef, { investments: newInvestments });
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
        ? { pinnedAssignments: arrayRemove(assignmentId) }
        : { pinnedAssignments: arrayUnion(assignmentId) };

    await updateDoc(userProfileRef, updateData);
    toast({
        title: isPinned ? 'Unpinned!' : 'Pinned!',
        description: `This assignment has been ${isPinned ? 'removed from' : 'added to'} your pinned items.`,
    });
  }

  const handleDelete = async () => {
    if (!firestore || !assignment) return;
    
    try {
      if(assignment.path && canDeleteFile) {
        await deleteFileFromSupabase(assignment.path, supabaseUrl!, supabaseAnonKey!);
      }
      await deleteDoc(assignmentRef!);
      toast({
        title: 'Success!',
        description: 'Assignment deleted successfully.'
      });
      router.push('/browse?tab=assignments');
    } catch (error) {
      console.error("Deletion failed:", error);
      toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete the assignment. Please try again.',
      });
    }
  };


  if (isLoading) {
    return <AssignmentDetailsSkeleton />;
  }

  if (!assignment) {
    return (
        <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">Assignment not found.</p>
            <Button asChild variant="link">
              <Link href="/browse?tab=assignments">Go back to browse</Link>
            </Button>
      </div>
    );
  }
  
  const date = assignment.createdAt ? assignment.createdAt.toDate().toLocaleDateString() : 'N/A';
  const description = assignment.description || `An assignment file for ${assignment.subject}.`;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/browse?tab=assignments" prefetch={true}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <StudyBuddy contentToAnalyze={description} fileUrl={assignment.fileUrl} />
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
                              This action cannot be undone. This will permanently delete your assignment and its associated file.
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
            <Badge variant="secondary">{assignment.subject}</Badge>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <SubjectIcon subject={assignment.subject} className="w-10 h-10 mt-1 text-primary" />
          <div className='flex-1'>
            <CardTitle className="text-3xl">{assignment.title}</CardTitle>
            <CardDescription className="mt-2 text-sm">
              Submitted by {assignment.userName || 'Anonymous'} on {date}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isOwner && !canDeleteFile && (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Configuration Warning</AlertTitle>
                <AlertDescription>
                    Supabase is not configured. File deletion will not work if you delete this item.
                </AlertDescription>
            </Alert>
        )}
        <p className="text-muted-foreground">{description}</p>
        
        {assignment.fileUrl && assignment.fileName && (
            <div className="flex items-center justify-between w-full p-4 mt-6 rounded-lg bg-muted">
                <div className="flex items-center gap-4">
                <FileIcon fileType={assignment.fileType} className="w-6 h-6" />
                <span className="font-medium">{assignment.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                    </a>
                </Button>
                <Button asChild size="sm">
                    <a href={assignment.fileUrl} download={assignment.fileName}>
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

        <CommentSection collectionPath={['assignments', assignmentId, 'comments']} />

      </CardContent>
    </Card>
  );
}
