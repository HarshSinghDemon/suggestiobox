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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth as useFirebaseAuth, useUser } from '@/firebase';
import { signInWithGoogle } from '@/lib/firebase/auth';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const auth = useFirebaseAuth();
  const { user, isUserLoading } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(auth);
      router.push('/');
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
       if (error.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled for this project. Please contact the administrator.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError(null);
    form.clearErrors();

    signInWithEmailAndPassword(auth, values.email, values.password)
      .then(userCredential => {
        router.push('/');
      })
      .catch(error => {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setError('Invalid email or password. Please try again.');
        } else if (error.code === 'auth/operation-not-allowed') {
          setError('Email/password sign-in is not enabled. Please contact the administrator.');
        }
        else {
          setError('An unexpected error occurred. Please try again later.');
        }
        console.error("Login Error:", error);
      });
  };

  return (
    <div className="grid gap-6">
       <Button variant="outline" onClick={handleGoogleSignIn} disabled={form.formState.isSubmitting || isUserLoading}>
          {(form.formState.isSubmitting || isUserLoading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <svg className="w-4 h-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 279.2 96 248 96c-106.1 0-192 85.9-192 192s85.9 192 192 192c98.2 0 176.7-76.7 183.4-176.1H248V261.8h239.2z"></path></svg>
          Login with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-background text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
              <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}
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
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isUserLoading}>
            {(form.formState.isSubmitting || isUserLoading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>
    </div>
  );
}
