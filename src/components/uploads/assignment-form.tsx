
'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateAssignment } from '@/lib/actions';
import { SEMESTER_ASSIGNMENT_SUBJECTS, SEMESTERS, type Semester } from '@/lib/constants';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { Progress } from '../ui/progress';
import { uploadFileToSupabase } from '@/lib/supabase/storage';
import type { FirebaseUser } from '@/lib/types';

type FileUploadState = {
  progress: number;
  url: string | null;
  name: string | null;
  path: string | null;
  type: string | null;
  error: string | null;
  isUploading: boolean;
};

const initialFileUploadState: FileUploadState = {
  progress: 0,
  url: null,
  name: null,
  path: null,
  type: null,
  error: null,
  isUploading: false,
};

type AssignmentFormProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function AssignmentForm({ supabaseUrl, supabaseAnonKey }: AssignmentFormProps) {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData } = useDoc<FirebaseUser>(userDocRef);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUpload, setFileUpload] =
    useState<FileUploadState>(initialFileUploadState);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  const availableSubjects = useMemo(() => {
    if (!selectedSemester) return [];
    return SEMESTER_ASSIGNMENT_SUBJECTS[selectedSemester];
  }, [selectedSemester]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileUpload(initialFileUploadState);
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setFileUpload({
        ...initialFileUploadState,
        error: 'File size must be less than 50MB.',
      });
      return;
    }

    setFileUpload({
      ...initialFileUploadState,
      isUploading: true,
      name: file.name,
      type: file.type,
      progress: 0, 
    });

    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials are not configured.");
      }
      
      setFileUpload(prev => ({ ...prev, progress: 50 })); // Simulate progress
      const result = await uploadFileToSupabase(file, supabaseUrl, supabaseAnonKey);
      
      setFileUpload({
        ...initialFileUploadState,
        url: result.url,
        path: result.path,
        name: result.name,
        type: result.type,
        isUploading: false,
        progress: 100,
      });

    } catch (error: any) {
        console.error('File upload failed:', error);
        setFileUpload({
            ...initialFileUploadState,
            error: `File upload failed: ${error.message}`,
        });
    }
  };

  const handleRemoveFile = () => {
    setFileUpload(initialFileUploadState);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isAuthLoading || !user) {
      toast({ variant: 'destructive', title: 'Please wait', description: 'You must be logged in to submit an assignment.' });
      return;
    }

    if (fileUpload.isUploading) {
      toast({ variant: 'destructive', title: 'Please wait', description: 'A file is currently being uploaded.' });
      return;
    }

    if (!fileUpload.url) {
      toast({ variant: 'destructive', title: 'File Required', description: 'Please upload a file for the assignment.' });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await validateAssignment(formData);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Validation Failed', description: result.message || 'Please check the form for errors.' });
      setIsSubmitting(false);
      return;
    }

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database connection not found.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const docData = {
        title: formData.get('title') as string,
        subject: formData.get('subject') as string,
        semester: formData.get('semester') as string,
        userId: user.uid,
        userName: userData?.displayName || user.displayName || 'Anonymous',
        userImage: userData?.photoURL || user.photoURL || null,
        createdAt: serverTimestamp(),
        fileUrl: fileUpload.url,
        fileName: fileUpload.name,
        path: fileUpload.path,
        fileType: fileUpload.type,
      };

      await addDoc(collection(firestore, 'assignments'), docData);

      toast({ title: 'Success!', description: 'Thank you for your contribution.', action: <CheckCircle className="text-green-500" /> });

      formRef.current?.reset();
      setFileUpload(initialFileUploadState);
      setSelectedSemester(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      router.push('/browse?tab=assignments');
    } catch (error) {
      console.error('Submission error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., Lab Assignment 1 - TCP/IP"
          required
        />
      </div>

       <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select name="semester" required onValueChange={(value) => setSelectedSemester(value as Semester)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                    {SEMESTERS.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                            {semester}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select name="subject" required disabled={!selectedSemester}>
            <SelectTrigger>
              <SelectValue placeholder={selectedSemester ? "Select a subject" : "Select a semester first"} />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Assignment File (Required)</Label>
          {!fileUpload.isUploading && !fileUpload.url && (
            <Input
              id="file"
              name="file"
              type="file"
              ref={fileInputRef}
              required
              onChange={handleFileChange}
              disabled={fileUpload.isUploading}
            />
          )}

          {fileUpload.isUploading && (
            <div className="space-y-2">
              <Progress value={fileUpload.progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Uploading: {fileUpload.name}
              </p>
            </div>
          )}

          {fileUpload.url && !fileUpload.isUploading && (
            <div className="flex items-center justify-between p-2 text-sm rounded-md bg-muted">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span className="truncate">{fileUpload.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={handleRemoveFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {fileUpload.error && (
            <p className="text-sm font-medium text-destructive">
              {fileUpload.error}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={
          isSubmitting || fileUpload.isUploading || !fileUpload.url || isAuthLoading
        }
        className="w-full"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : null}
        {isSubmitting ? 'Submitting...' : 'Upload Assignment'}
      </Button>
    </form>
  );
}
