
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
import { signInWithEmailAndPassword, sendEmailVerification, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth as useFirebaseAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useFirebaseAuth();
  const { isUserLoading } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleResendVerification = async () => {
    if (unverifiedUser) {
        try {
            await sendEmailVerification(unverifiedUser);
            toast({
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your email address."
            });
        } catch (error) {
            console.error("Resend verification error:", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to resend verification email."
            })
        }
    }
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError(null);
    setUnverifiedUser(null);
    setIsLoading(true);

    signInWithEmailAndPassword(auth, values.email, values.password)
      .then(userCredential => {
        const user = userCredential.user;
        if (!user.emailVerified) {
            setError('Please verify your email before logging in.');
            setUnverifiedUser(user);
            auth.signOut(); // Sign out the unverified user
        } else {
            router.push('/');
        }
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
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  const isFormLoading = isLoading || isUserLoading;

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
              <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>
                    {error}
                    {unverifiedUser && (
                        <Button variant="link" className="p-0 h-auto mt-1" onClick={handleResendVerification}>
                            Resend verification email
                        </Button>
                    )}
                  </AlertDescription>
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
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                      <span className="sr-only">
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isFormLoading}>
            {isFormLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Login with Email
          </Button>
        </form>
      </Form>
    </div>
  );
}
