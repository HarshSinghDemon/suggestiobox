
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, User as UserIcon } from 'lucide-react';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { ProfileAvatarModal } from '@/components/profile-avatar-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';

const formSchema = z.object({
  year: z.enum(['1st', '2nd', '3rd'], { required_error: 'Please select your year.'}),
});

export default function CompleteProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    
    setIsSubmitting(true);
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, { year: values.year });

        toast({
            title: 'Profile Complete!',
            description: 'Welcome aboard!',
        });
        
        router.push('/');

    } catch(error) {
        console.error("Error completing profile: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update your profile. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="w-8 h-8 animate-spin" />
          </div>
      );
  }

  return (
    <AuthWrapper>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Just a few more details to get you started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 mb-8">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'User'} />
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
                <Button variant="outline" onClick={() => setIsAvatarModalOpen(true)}>Change Avatar</Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Finish Setup
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <ProfileAvatarModal isOpen={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen} />
    </AuthWrapper>
  );
}
