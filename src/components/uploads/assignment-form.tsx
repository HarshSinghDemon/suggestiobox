'use client';

import { useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { validateAssignment } from '@/lib/actions';
import { ASSIGNMENT_SUBJECTS } from '@/lib/constants';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Progress } from '../ui/progress';

type FileUploadState = {
  progress: number;
  url: string | null;
  path: string | null;
  name: string | null;
  type: string | null;
  error: string | null;
  isUploading: boolean;
};

const initialFileUploadState: FileUploadState = {
  progress: 0,
  url: null,
  path: null,
  name: null,
  type: null,
  error: null,
  isUploading: false,
};

export function AssignmentForm() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUpload, setFileUpload] = useState<FileUploadState>(initialFileUploadState);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
        setFileUpload(initialFileUploadState);
        return;
    };

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setFileUpload({ ...initialFileUploadState, error: 'File size must be less than 10MB.' });
        return;
    }

    setFileUpload({ ...initialFileUploadState, isUploading: true, name: selectedFile.name, type: selectedFile.type });

    try {
        const storage = getStorage();
        const userId = user?.uid || 'anonymous';
        const storagePath = `assignments/${userId}/${Date.now()}-${selectedFile.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setFileUpload(prev => ({ ...prev, progress }));
            },
            (error) => {
                console.error("Upload error:", error);
                setFileUpload(prev => ({ ...prev, error: 'File upload failed. Please try again.', isUploading: false }));
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setFileUpload(prev => ({ ...prev, url: downloadURL, path: storagePath, isUploading: false, progress: 100 }));
            }
        );
    } catch (error) {
        console.error('File upload failed:', error);
        setFileUpload({ ...initialFileUploadState, error: 'File upload failed. Please try again.' });
    }
  };

  const handleRemoveFile = async () => {
    if (!fileUpload.path) return;
    
    const storage = getStorage();
    const fileRef = ref(storage, fileUpload.path);

    try {
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Error removing file:", error);
    } finally {
        setFileUpload(initialFileUploadState);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUserLoading) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Authentication is still loading.',
      });
      return;
    }

    if (fileUpload.isUploading) {
        toast({
            variant: "destructive",
            title: "Please wait",
            description: "A file is currently being uploaded.",
        });
        return;
    }

    if (!fileUpload.url) {
        toast({
            variant: "destructive",
            title: "File Required",
            description: "Please upload a file for the assignment.",
        });
        return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await validateAssignment(formData);

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: result.message || "Please check the form for errors.",
      });
      setIsSubmitting(false);
      return;
    }

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connection not found.',
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const docData = {
        description: formData.get('description') as string,
        subject: formData.get('subject') as string,
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || 'Anonymous',
        userImage: user?.photoURL || null,
        createdAt: serverTimestamp(),
        fileUrl: fileUpload.url,
        fileName: fileUpload.name,
        fileType: fileUpload.type,
      };

      await addDoc(collection(firestore, 'assignments'), docData);

      toast({
        title: 'Success!',
        description: 'Thank you for your contribution.',
        action: <CheckCircle className="text-green-500" />,
      });
      
      formRef.current?.reset();
      setFileUpload(initialFileUploadState);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.push('/browse?tab=assignments');
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the assignment or lab file..."
          className="min-h-[120px]"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select name="subject" required>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNMENT_SUBJECTS.map((subject) => (
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
                    <p className="text-sm text-muted-foreground">Uploading: {fileUpload.name}</p>
                </div>
            )}

            {fileUpload.url && !fileUpload.isUploading && (
                <div className="flex items-center justify-between p-2 text-sm rounded-md bg-muted">
                    <div className="flex items-center gap-2 truncate">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="truncate">{fileUpload.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="w-6 h-6" onClick={handleRemoveFile}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
            
            {fileUpload.error && <p className="text-sm font-medium text-destructive">{fileUpload.error}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || fileUpload.isUploading || !fileUpload.url || isUserLoading} className="w-full">
        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {isSubmitting ? 'Submitting...' : 'Upload Assignment'}
      </Button>
    </form>
  );
}
