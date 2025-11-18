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
import { CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

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
    if (isAuthLoading) {
      toast({
        variant: "destructive",
        title: "Authentication still loading",
        description: "Please wait a moment and try again.",
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
    
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'File is required for an assignment.',
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
        fileUrl: '',
        fileName: file.name,
        fileType: file.type,
      };

      const docRef = await addDoc(collection(firestore, 'assignments'), docData);
      
      const storage = getStorage();
      const storagePath = `assignments/${docData.userId}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(docRef, { fileUrl: downloadURL });

      toast({
        title: 'Success!',
        description: 'Thank you for your contribution.',
        action: <CheckCircle className="text-green-500" />,
      });
      
      formRef.current?.reset();
      setFile(null);
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
