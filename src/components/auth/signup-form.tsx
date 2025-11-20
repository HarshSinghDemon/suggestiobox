

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
import { useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, User as UserIcon } from 'lucide-react';
import { useAuth as useFirebaseAuth, useUser } from '@/firebase';
import Image from 'next/image';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { moderateText } from '@/ai/flows/moderate-text';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  year: z.enum(['1st', '2nd', '3rd'], { required_error: 'Please select your year.'}),
});

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const auth = useFirebaseAuth();
  const { isUserLoading } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const nameValue = form.watch('name');

  const avatarUrl = useMemo(() => {
    if (!nameValue) return '';
    const seed = encodeURIComponent(nameValue);
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&radius=50&backgroundColor=7950f2,f1efff,51d5ff&backgroundType=gradientLinear`;
  }, [nameValue]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    setIsSigningUp(true);

    try {
        const moderationResult = await moderateText({ text: values.name });
        if (moderationResult.isHarmful) {
            setError(moderationResult.reason || 'Your display name is not appropriate. Please choose another one.');
            setIsSigningUp(false);
            return;
        }

        const finalPhotoURL = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(values.name)}`;
        
        await signUpWithEmail(auth, values.email, values.password, values.name, finalPhotoURL, values.year);
        router.push('/verify-email');

    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            setError('This email is already in use. Please log in.');
        } else {
            console.error('Sign-up submission error:', e);
            setError('Failed to create an account. Please try again.');
        }
    } finally {
        setIsSigningUp(false);
    }
  };

  const isFormLoading = isSigningUp || isUserLoading;

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Sign-up Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
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
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className='space-y-2'>
              <FormLabel>Your Unique Avatar</FormLabel>
              <div className='flex items-center justify-center p-4 rounded-md bg-muted/50'>
                <div className="relative w-24 h-24 rounded-full bg-background">
                  {avatarUrl ? (
                    <Image 
                      src={avatarUrl} 
                      alt="Your generated avatar" 
                      fill 
                      className="object-cover rounded-full"
                      unoptimized // Required for SVG images from external URLs
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                      <UserIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">Your avatar is automatically generated based on your name.</p>
          </div>


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
          <Button type="submit" className="w-full" disabled={isFormLoading}>
            {isFormLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isFormLoading ? 'Creating account...' : 'Create account with Email'}
          </Button>
        </form>
      </Form>
    </>
  );
}
