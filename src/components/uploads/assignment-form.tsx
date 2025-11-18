'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
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
import { validateAssignment, AssignmentFormState } from '@/lib/actions';
import { ASSIGNMENT_SUBJECTS } from '@/lib/constants';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

const initialState: AssignmentFormState = {
  message: '',
  errors: {},
  success: false,
};

export function AssignmentForm() {
  const { user, loading: isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit an assignment.',
      });
      setIsSubmitting(false);
      return;
    }

    if (!file) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: "An assignment file is required.",
      });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const result = await validateAssignment(initialState, formData);

    if (!result.success) {
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
        description: formData.get('description') as string,
        subject: formData.get('subject') as string,
        userId: user.uid,
        userName: user.displayName,
        userImage: user.photoURL,
        createdAt: serverTimestamp(),
        fileUrl: '',
        fileName: file.name,
        fileType: file.type,
      };

      const docRef = await addDoc(collection(firestore, 'assignments'), docData);
      
      const storage = getStorage();
      const storageRef = ref(storage, `assignments/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(docRef, { fileUrl: downloadURL });

      toast({
        title: 'Success!',
        description: 'Your assignment has been submitted.',
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
          <Input 
            id="file" 
            name="file" 
            type="file" 
            required 
            onChange={handleFileChange}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || isAuthLoading} className="w-full">
        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {isSubmitting ? 'Submitting...' : 'Upload Assignment'}
      </Button>
    </form>
  );
}
