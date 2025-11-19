'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useAuth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { MailCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user?.emailVerified) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);
  
  const handleResendVerification = async () => {
    if (user) {
      setIsSending(true);
      try {
        await sendEmailVerification(user);
        toast({
          title: 'Verification Email Sent',
          description: 'A new verification link has been sent to your email address.',
        });
      } catch (error) {
        console.error('Error resending verification email:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to resend verification email. Please try again later.',
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  if (isUserLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="w-8 h-8 animate-spin" />
          </div>
      )
  }

  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-md mx-auto text-center">
                <CardHeader>
                    <CardTitle>Not Logged In</CardTitle>
                    <CardDescription>You must be logged in to view this page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <MailCheck className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            A verification link has been sent to your email address:
            <br />
            <strong className="font-medium text-foreground">{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please check your inbox (and spam folder) and click the link to complete your registration. This page will automatically redirect after you have verified your email.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleResendVerification} disabled={isSending}>
              {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Resend Verification Email
            </Button>
            <Button variant="ghost" onClick={() => auth.signOut()}>
                Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}