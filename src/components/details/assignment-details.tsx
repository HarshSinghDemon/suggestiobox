
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import type { Assignment } from '@/lib/types';
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
import { Download, ArrowLeft, Eye, Trash2 } from 'lucide-react';
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
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function AssignmentDetails({ assignmentId, supabaseUrl, supabaseAnonKey }: AssignmentDetailsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const assignmentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'assignments', assignmentId) : null),
    [firestore, assignmentId]
  );
  
  const { data: assignment, isLoading } = useDoc<Assignment>(assignmentRef);
  const isOwner = user && assignment && user.uid === assignment.userId;
  
  const handleDelete = async () => {
    if (!firestore || !assignment) return;
    
    try {
      if(assignment.path) {
        await deleteFileFromSupabase(assignment.path, supabaseUrl, supabaseAnonKey);
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

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/browse?tab=assignments" prefetch={true}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Link>
          </Button>
          <div className="flex items-center gap-2">
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
        <p className="text-muted-foreground">This is an assignment file submission. Please download the file to view its contents.</p>
      </CardContent>
      {assignment.fileUrl && assignment.fileName && (
        <CardFooter>
          <div className="flex items-center justify-between w-full p-4 rounded-lg bg-muted">
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
        </CardFooter>
      )}
    </Card>
  );
}
