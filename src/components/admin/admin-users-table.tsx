
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Timestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState } from 'react';
import type { FirebaseUser } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { UserProfilePopover } from '../chat/user-profile-popover';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type User = FirebaseUser & {
    createdAt?: Timestamp;
};

const YEARS: ('1st' | '2nd' | '3rd')[] = ['1st', '2nd', '3rd'];
const ROLES: ('user' | 'admin')[] = ['user', 'admin'];

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-10 h-8" />
        </div>
      ))}
    </div>
  );
}

export function AdminUsersTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null),
    [firestore]
  );

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const handleYearChange = async (userId: string, newYear: string) => {
    if (!firestore) return;
    setUpdatingId(userId);
    const docRef = doc(firestore, 'users', userId);
    try {
        await updateDoc(docRef, { year: newYear });
        toast({
            title: "Year Updated",
            description: "The user's year has been changed.",
        });
    } catch(e) {
        console.error("Failed to update year:", e);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the user's year.",
        });
    } finally {
        setUpdatingId(null);
    }
  }
  
  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
      if (!firestore) return;
      setUpdatingId(userId);
      const docRef = doc(firestore, 'users', userId);
      const updatedData = { role: newRole };

      updateDoc(docRef, updatedData)
        .then(() => {
            toast({
                title: "Role Updated",
                description: `User role has been changed to ${newRole}.`
            });
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setUpdatingId(null);
        });
  }


  const handleDelete = (userId: string) => {
    if (!firestore) return;
    
    const docRef = doc(firestore, 'users', userId);
    deleteDocumentNonBlocking(docRef);

    toast({
        title: 'Success',
        description: 'User document deleted successfully from the database.',
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'User ID copied to clipboard.' });
  }
  
  const CREATOR_EMAIL = 'harshroop100@gmail.com';

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="w-full overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className='hidden sm:table-cell'>Year</TableHead>
            <TableHead className='hidden md:table-cell'>Role</TableHead>
            <TableHead className="hidden lg:table-cell">User ID</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users && users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer">
                            <Avatar className="w-8 h-8">
                            <AvatarImage src={user.photoURL ?? undefined} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate">{user.displayName || 'Unnamed User'}</span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className='w-80'>
                        <UserProfilePopover user={user} />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell className="truncate">{user.email}</TableCell>
                 <TableCell className="hidden sm:table-cell w-[150px]">
                    <Select
                        defaultValue={user.year}
                        onValueChange={(value) => handleYearChange(user.id, value)}
                        disabled={updatingId === user.id}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="N/A" />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map(year => (
                                <SelectItem key={year} value={year}>{year} Year</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </TableCell>
                 <TableCell className="hidden md:table-cell w-[150px]">
                    <Select
                        defaultValue={user.role || 'user'}
                        onValueChange={(value: 'user' | 'admin') => handleRoleChange(user.id, value)}
                        disabled={updatingId === user.id || user.email === CREATOR_EMAIL}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLES.map(role => (
                                <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </TableCell>
                <TableCell className="hidden font-mono text-xs lg:table-cell">
                    <div className="flex items-center gap-2">
                        <span className="truncate">{user.id}</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => copyToClipboard(user.id)}>
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={user.email === CREATOR_EMAIL}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will permanently delete the user's data (profile, etc.) from the database. It will NOT delete their authentication record, and they will still be able to log in. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(user.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete User Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
