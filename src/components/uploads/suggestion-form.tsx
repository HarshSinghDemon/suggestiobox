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
import { validateSuggestion, SuggestionFormState } from '@/lib/actions';
import { SUBJECTS } from '@/lib/constants';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

const initialState: SuggestionFormState = {
  message: '',
  errors: {},
  success: false,
};

export function SuggestionForm() {
  const { user, loading: isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<SuggestionFormState>(initialState);
  
  const isDescriptionRequired = !file;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormState(initialState);
    setIsSubmitting(true);
    
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit a suggestion.',
      });
      setIsSubmitting(false);
      return;
    }
    
    const formData = new FormData(event.currentTarget);
    const result = await validateSuggestion(initialState, formData);

    if (!result.success) {
        setFormState(result);
        toast({
            variant: "destructive",
            title: "Validation Failed",
            description: result.message || "Please check the form for errors.",
        });
        setIsSubmitting(false);
        return;
    }

    try {
      const docData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        subject: formData.get('subject') as string,
        userId: user.uid,
        userName: user.displayName,
        userImage: user.photoURL,
        createdAt: serverTimestamp(),
        fileUrl: '',
        fileName: file?.name || '',
        fileType: file?.type || '',
      };

      const docRef = await addDoc(collection(firestore, 'suggestions'), docData);
      
      let downloadURL = '';
      if (file) {
        const storage = getStorage();
        const storageRef = ref(storage, `suggestions/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        downloadURL = await getDownloadURL(storageRef);
        
        await updateDoc(docRef, { fileUrl: downloadURL });
      }

      toast({
        title: 'Success!',
        description: 'Your suggestion has been submitted.',
        action: <CheckCircle className="text-green-500" />,
      });
      
      formRef.current?.reset();
      setFile(null);
      router.push('/browse');
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

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g., Easy way to understand TCP handshake" required />
        {formState.errors?.title && (
          <p className="text-sm font-medium text-destructive">{formState.errors.title}</p>
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
          <p className="text-sm font-medium text-destructive">{formState.errors.description}</p>
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
            <p className="text-sm font-medium text-destructive">{formState.errors.subject}</p>
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
          {formState.errors?.file && (
            <p className="text-sm font-medium text-destructive">{formState.errors.file}</p>
          )}
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting || isAuthLoading} className="w-full">
        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
      </Button>
    </form>
  );
}
