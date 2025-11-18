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
import { uploadAssignment, AssignmentFormState } from '@/lib/actions';
import { ASSIGNMENT_SUBJECTS } from '@/lib/constants';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {pending ? 'Submitting...' : 'Upload Assignment'}
    </Button>
  );
}

const initialState: AssignmentFormState = {
  message: '',
  errors: {},
  success: false,
};

export function AssignmentForm() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [state, formAction] = useActionState(uploadAssignment, initialState);
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [idToken, setIdToken] = useState<string>('');

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
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);

          // Update Firestore document
          if (firestore) {
            const docRef = doc(firestore, state.uploadInfo.collection, state.uploadInfo.documentId);
            await updateDoc(docRef, { fileUrl: downloadURL });
          }

          toast({
            title: 'Success!',
            description: "Assignment and file uploaded successfully!",
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
      }
    };

    handleFileUpload();
  }, [state, file, firestore, toast, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="idToken" value={idToken} />
      {state.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the assignment or lab file..."
          className="min-h-[120px]"
          required
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
              {ASSIGNMENT_SUBJECTS.map((subject) => (
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
          <Label htmlFor="file">Assignment File (Required)</Label>
          <Input 
            id="file" 
            name="file" 
            type="file" 
            required 
            onChange={handleFileChange}
          />
          {state.errors?.file && (
            <p className="text-sm font-medium text-destructive">{state.errors.file}</p>
          )}
        </div>
      </div>

      <SubmitButton disabled={!idToken} />
    </form>
  );
}
