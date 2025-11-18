'use client';

import { useEffect, useRef } from 'react';
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
  const [state, formAction] = useActionState(uploadSuggestion, initialState);
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Explain your suggestion in detail..."
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
          <Label htmlFor="file">Optional File (PDF, JPG, PNG)</Label>
          <Input id="file" name="file" type="file" accept="image/jpeg,image/png,application/pdf" />
          {state.errors?.file && (
            <p className="text-sm font-medium text-destructive">{state.errors.file}</p>
          )}
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
