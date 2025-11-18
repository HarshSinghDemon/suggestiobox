'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signUpWithEmail } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth as useFirebaseAuth } from '@/firebase';
import Image from 'next/image';
import { CardDescription } from '../ui/card';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  photoURL: z.string().url({ message: 'Please generate an avatar.' }).min(1, 'Please generate an avatar.'),
});

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const auth = useFirebaseAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      photoURL: '',
    },
  });
  
  const nameValue = form.watch('name');
  const generatedAvatarUrl = form.watch('photoURL');

  const handleGenerateAvatar = async () => {
    if (!nameValue) {
      form.setError('name', { type: 'manual', message: 'Please enter your name first.' });
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const avatarDataUri = await generateAvatar(nameValue);
      form.setValue('photoURL', avatarDataUri, { shouldValidate: true });
    } catch (e: any) {
      console.error('Avatar generation failed:', e);
      setError('Could not generate an avatar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    try {
      await signUpWithEmail(auth, values.email, values.password, values.name, values.photoURL);
      router.push('/');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please log in.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
      console.error(e);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="photoURL"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Your Unique Avatar</FormLabel>
                <CardDescription>Generate a unique avatar based on your name.</CardDescription>
                <div className="flex items-center gap-4 pt-2">
                  <div className="relative w-24 h-24 rounded-full bg-muted/50">
                    {isGenerating ? (
                      <Skeleton className="w-full h-full rounded-full" />
                    ) : generatedAvatarUrl ? (
                      <Image src={generatedAvatarUrl} alt="Generated Avatar" fill className="object-cover rounded-full" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full rounded-full bg-muted">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button type="button" onClick={handleGenerateAvatar} disabled={isGenerating || !nameValue}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Avatar'}
                  </Button>
                </div>
                <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isGenerating}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
}
