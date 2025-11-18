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
import { AlertCircle } from 'lucide-react';
import { useAuth as useFirebaseAuth } from '@/firebase';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardDescription } from '../ui/card';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  photoURL: z.string().url({ message: 'Please select an avatar.' }),
});

const avatarSeeds = [
  'Gizmo',
  'Sparky',
  'Bolt',
  'Pixel',
  'Widget',
  'Nano',
  'Zorp',
  'Glitch',
  'Orbit',
  'Comet',
  'Radar',
  'Cygnus',
];

const generateAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`;

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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
          name="photoURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Choose Your Avatar</FormLabel>
               <CardDescription>Select a cool avatar to represent you!</CardDescription>
              <FormControl>
                <div className="grid grid-cols-4 gap-4 py-2">
                  {avatarSeeds.map((seed) => (
                    <button
                      type="button"
                      key={seed}
                      className={cn(
                        'rounded-full p-1 ring-2 ring-transparent transition-all hover:ring-primary focus:ring-primary',
                        field.value === generateAvatarUrl(seed) && 'ring-primary'
                      )}
                      onClick={() => field.onChange(generateAvatarUrl(seed))}
                    >
                      <Image
                        src={generateAvatarUrl(seed)}
                        alt={`${seed} avatar`}
                        width={64}
                        height={64}
                        className="rounded-full bg-muted"
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
}
