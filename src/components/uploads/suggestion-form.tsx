'use client';

import { useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { validateSuggestion, type SuggestionFormState } from '@/lib/actions';
import { SUBJECTS } from '@/lib/constants';
import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Progress } from '../ui/progress';
import { uploadFile } from '@/lib/firebase/storage';
import { UploadTask } from 'firebase/storage';

const initialState: SuggestionFormState = {
  message: '',
  errors: {},
  success: false,
};

type FileUploadState = {
  progress: number;
  url: string | null;
  name: string | null;
  path: string | null;
  error: string | null;
  isUploading: boolean;
};

const initialFileUploadState: FileUploadState = {
  progress: 0,
  url: null,
  name: null,
  path: null,
  error: null,
  isUploading: false,
};

export function SuggestionForm() {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTask, setUploadTask] = useState<UploadTask | null>(null);

  const [formState, setFormState] = useState<SuggestionFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUpload, setFileUpload] =
    useState<FileUploadState>(initialFileUploadState);

  const isDescriptionRequired = !fileUpload.url;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      setFileUpload({
        ...initialFileUploadState,
        error: 'File size must be less than 100MB.',
      });
      return;
    }

    setFileUpload({
      ...initialFileUploadState,
      isUploading: true,
      name: file.name,
    });
    
    try {
      const { task } = uploadFile(
        file,
        (progress) => {
          setFileUpload((prev) => ({...prev, progress}));
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          setFileUpload((prev) => ({
            ...prev,
            error: 'File upload failed. Please try again.',
            isUploading: false,
          }));
          setUploadTask(null);
        },
        (downloadURL, fullPath) => {
          setFileUpload((prev) => ({
            ...prev,
            url: downloadURL,
            path: fullPath,
            isUploading: false,
            progress: 100,
          }));
          setUploadTask(null);
        }
      );
      setUploadTask(task);
    } catch (error) {
      console.error('File upload process failed:', error);
      setFileUpload({
        ...initialFileUploadState,
        error: 'File upload setup failed. Please try again.',
      });
    }
  };

  const handleRemoveFile = () => {
    if (uploadTask) {
        uploadTask.cancel();
    }
    setFileUpload(initialFileUploadState);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAuthLoading) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Authentication is still loading.',
      });
      return;
    }

    if (fileUpload.isUploading) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'A file is currently being uploaded.',
      });
      return;
    }

    setIsSubmitting(true);
    setFormState(initialState);

    const formData = new FormData(event.currentTarget);
    const result = await validateSuggestion(formData, !!fileUpload.url);

    if (!result.success) {
      setFormState(result);
      toast({
        variant: 'destructive',
        title: 'Validation Failed',
        description: result.message || 'Please check the form for errors.',
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
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        subject: formData.get('subject') as string,
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || (formData.get('name') as string) || 'Anonymous',
        userImage: user?.photoURL || null,
        createdAt: serverTimestamp(),
        fileUrl: fileUpload.url || null,
        fileName: fileUpload.name || null,
        filePath: fileUpload.path || null,
        fileType: fileUpload.name ? fileUpload.name.split('.').pop() : null,
      };

      const docRef = await addDoc(collection(firestore, 'suggestions'), docData);

      toast({
        title: 'Success!',
        description: 'Thank you for your contribution.',
        action: <CheckCircle className="text-green-500" />,
      });

      formRef.current?.reset();
      setFileUpload(initialFileUploadState);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      router.push(`/suggestions/${docRef.id}`);
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
      {formState.message && !formState.success && !formState.errors?.ai && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formState.message}</AlertDescription>
        </Alert>
      )}

      {formState.errors?.ai && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Content Moderation</AlertTitle>
          <AlertDescription>{formState.errors.ai}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g., Easy way to understand TCP handshake"
            required
          />
          {formState.errors?.title && (
            <p className="text-sm font-medium text-destructive">
              {formState.errors.title}
            </p>
          )}
        </div>
        {!user && !isAuthLoading && (
          <div className="space-y-2">
            <Label htmlFor="name">Your Name (Optional)</Label>
            <Input id="name" name="name" placeholder="John Doe" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description {isDescriptionRequired ? '' : '(Optional)'}
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Explain your suggestion in detail..."
          className="min-h-[120px]"
          required={isDescriptionRequired}
        />
        {formState.errors?.description && (
          <p className="text-sm font-medium text-destructive">
            {formState.errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select name="subject" required>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formState.errors?.subject && (
            <p className="text-sm font-medium text-destructive">
              {formState.errors.subject}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Optional File</Label>
          {!fileUpload.isUploading && !fileUpload.url && (
            <Input
              id="file"
              name="file"
              type="file"
              ref={fileInputRef}
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
        disabled={isSubmitting || fileUpload.isUploading || isAuthLoading}
        className="w-full"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : null}
        {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
      </Button>
    </form>
  );
}
