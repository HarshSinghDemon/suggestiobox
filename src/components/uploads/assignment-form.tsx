'use client';

import { useEffect, useRef, useActionState } from 'react';
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
import { SUBJECTS } from '@/lib/constants';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {pending ? 'Uploading...' : 'Upload Assignment'}
    </Button>
  );
}

const initialState: AssignmentFormState = {
  message: '',
  errors: {},
  success: false,
};

export function AssignmentForm() {
  const [state, formAction] = useActionState(uploadAssignment, initialState);
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
        action: <CheckCircle className="text-green-500" />,
      });
      formRef.current?.reset();
      router.push('/browse');
    }
  }, [state.success, state.message, toast, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
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
          <Label htmlFor="file">Assignment File (Required)</Label>
          <Input id="file" name="file" type="file" required />
          {state.errors?.file && (
            <p className="text-sm font-medium text-destructive">{state.errors.file}</p>
          )}
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
