
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Suggestion } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
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
import { useUser } from '@/firebase';
import { deleteFileFromSupabase } from '@/lib/supabase/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SEMESTERS } from '@/lib/constants';
import { useState } from 'react';

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="w-10 h-8" />
        </div>
      ))}
    </div>
  );
}

type AdminSuggestionsTableProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function AdminSuggestionsTable({ supabaseUrl, supabaseAnonKey }: AdminSuggestionsTableProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const suggestionsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'suggestions'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: suggestions, isLoading } = useCollection<Suggestion>(suggestionsQuery);

  const handleDelete = async (suggestion: Suggestion) => {
    if (!firestore) return;

    try {
        if (suggestion.path) {
            await deleteFileFromSupabase(suggestion.path, supabaseUrl, supabaseAnonKey);
        }
        
        const docRef = doc(firestore, 'suggestions', suggestion.id);
        await deleteDoc(docRef);

        toast({
            title: 'Success',
            description: 'Suggestion and associated file deleted successfully.',
        });

    } catch (error) {
        console.error("Deletion failed:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete the suggestion. Please check the logs and try again.',
        });
    }
  };
  
  const handleSemesterChange = async (suggestionId: string, newSemester: string) => {
    if (!firestore) return;
    setUpdatingId(suggestionId);
    const docRef = doc(firestore, 'suggestions', suggestionId);
    try {
        await updateDoc(docRef, { semester: newSemester });
        toast({
            title: "Semester Updated",
            description: "The suggestion's semester has been changed.",
        });
    } catch(e) {
        console.error("Failed to update semester:", e);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the semester.",
        });
    } finally {
        setUpdatingId(null);
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="w-full overflow-x-auto border-y md:border md:rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">User</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>File</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suggestions && suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <TableRow key={suggestion.id}>
                <TableCell className="font-medium max-w-[150px] md:max-w-sm truncate">{suggestion.title}</TableCell>
                <TableCell className="hidden md:table-cell">{suggestion.userName || 'Anonymous'}</TableCell>
                <TableCell className="w-[150px]">
                    <Select
                        defaultValue={suggestion.semester}
                        onValueChange={(value) => handleSemesterChange(suggestion.id, value)}
                        disabled={updatingId === suggestion.id}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                            {SEMESTERS.map(sem => (
                                <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell>
                  {suggestion.fileUrl ? (
                    <a
                      href={suggestion.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary hover:text-primary/80"
                    >
                      View File
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No file</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={!user}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the suggestion and its associated file if it exists.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(suggestion)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No suggestions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
