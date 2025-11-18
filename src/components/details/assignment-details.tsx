'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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
import { Download, ArrowLeft } from 'lucide-react';
import { FileIcon } from '@/components/browse/file-icon';
import { SubjectIcon } from '@/components/browse/subject-icon';
import Link from 'next/link';

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

export function AssignmentDetails({ assignmentId }: { assignmentId: string }) {
  const firestore = useFirestore();

  const assignmentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'assignments', assignmentId) : null),
    [firestore, assignmentId]
  );
  
  const { data: assignment, isLoading } = useDoc<Assignment>(assignmentRef);

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
            <Link href="/browse?tab=assignments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Link>
          </Button>
          <Badge variant="secondary">{assignment.subject}</Badge>
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
            <a 
                href={assignment.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download={assignment.fileName}
                className="w-full"
            >
                <div className="flex items-center justify-between w-full p-4 transition-colors rounded-lg bg-muted hover:bg-muted/80">
                    <div className="flex items-center gap-4">
                        <FileIcon fileType={assignment.fileType} className="w-6 h-6" />
                        <span className="font-medium">{assignment.fileName}</span>
                    </div>
                    <Download className="w-5 h-5 text-muted-foreground" />
                </div>
          </a>
        </CardFooter>
      )}
    </Card>
  );
}
