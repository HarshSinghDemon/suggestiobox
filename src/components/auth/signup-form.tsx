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
import { cn } from '@/lib/utils';
import { CardDescription } from '../ui/card';
import { generateAvatar } from '@/ai/flows/generate-avatar-flow';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  photoURL: z.string().url({ message: 'Please generate an avatar.' }).min(1, 'Please generate an avatar.'),
});


export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
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

  const handleGenerateAvatar = async () => {
    const name = form.getValues('name');
    if (!name) {
      form.setError('name', { type: 'manual', message: 'Please enter your name first to generate an avatar.' });
      return;
    }

    setIsGeneratingAvatar(true);
    form.setValue('photoURL', ''); // Clear previous avatar

    try {
      const imageUrl = await generateAvatar(name);
      form.setValue('photoURL', imageUrl, { shouldValidate: true });
    } catch (e) {
      console.error(e);
      form.setError('photoURL', { type: 'manual', message: 'Could not generate avatar. Please try again.' });
    } finally {
      setIsGeneratingAvatar(false);
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
              <FormLabel>Your Avatar</FormLabel>
              <CardDescription>Enter your name, then generate a unique avatar!</CardDescription>
              <div className="flex items-center gap-4 pt-2">
                  <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    {field.value && (
                        <Image
                            src={field.value}
                            alt="Generated Avatar"
                            width={96}
                            height={96}
                            className="rounded-full"
                        />
                    )}
                    {isGeneratingAvatar && <Loader2 className="absolute w-8 h-8 animate-spin text-muted-foreground" />}
                  </div>
                  <Button type="button" onClick={handleGenerateAvatar} disabled={isGeneratingAvatar}>
                    {isGeneratingAvatar ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Avatar</>}
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
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isGeneratingAvatar}>
          {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
}
