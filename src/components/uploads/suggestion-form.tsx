'use client';

import { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { uploadSuggestion, SuggestionFormState } from '@/lib/actions';
import { SUBJECTS } from '@/lib/constants';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {pending ? 'Submitting...' : 'Submit Suggestion'}
    </Button>
  );
}

const initialState: SuggestionFormState = {
  message: '',
  errors: {},
  success: false,
};

export function SuggestionForm() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [state, formAction] = useActionState(uploadSuggestion, initialState);
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [idToken, setIdToken] = useState<string>('');
  
  const isDescriptionRequired = !file;

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setIdToken);
    }
  }, [user]);

  useEffect(() => {
    const handleFileUpload = async () => {
      if (state.success && state.uploadInfo && file) {
        try {
          const storage = getStorage();
          const storageRef = ref(storage, state.uploadInfo.uploadPath);

          // Upload file
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);

          // Update Firestore document with the file URL
          if (firestore) {
            const docRef = doc(firestore, state.uploadInfo.collection, state.uploadInfo.documentId);
            await updateDoc(docRef, { fileUrl: downloadURL });
          }

          toast({
            title: 'Success!',
            description: "Suggestion and file uploaded successfully!",
            action: <CheckCircle className="text-green-500" />,
          });
          formRef.current?.reset();
          setFile(null);
          router.push('/browse');

        } catch (error) {
          console.error("File upload or Firestore update failed:", error);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "There was an error uploading your file. Please try again.",
          });
        }
      } else if (state.success && !state.uploadInfo) {
        toast({
          title: 'Success!',
          description: state.message,
          action: <CheckCircle className="text-green-500" />,
        });
        formRef.current?.reset();
        setFile(null);
        router.push('/browse');
      }
    };
    
    handleFileUpload();
  }, [state, file, firestore, toast, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="idToken" value={idToken} />
      {state.message && !state.success && !state.errors?.ai && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.errors?.ai && (
         <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Content Moderation</AlertTitle>
            <AlertDescription>{state.errors.ai}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g., Easy way to understand TCP handshake" required />
        {state.errors?.title && (
          <p className="text-sm font-medium text-destructive">{state.errors.title}</p>
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
        {state.errors?.description && (
          <p className="text-sm font-medium text-destructive">{state.errors.description}</p>
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
          {state.errors?.subject && (
            <p className="text-sm font-medium text-destructive">{state.errors.subject}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Optional File</Label>
          <Input 
            id="file" 
            name="file"
            type="file" 
            onChange={handleFileChange}
          />
          {state.errors?.file && (
            <p className="text-sm font-medium text-destructive">{state.errors.file}</p>
          )}
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}