'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { updateProfile } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  const desiredPhotoURL = "https://github.com/shadcn.png";

  useEffect(() => {
    if (loading) return;
    
    if (!adminUid) {
        console.error("Admin UID is not configured. Set NEXT_PUBLIC_ADMIN_UID in your environment variables.");
        // We don't redirect here, just show access denied if the check below fails.
        return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // Perform the one-time profile update if necessary, but don't block rendering.
    if (user && user.uid === adminUid && user.photoURL !== desiredPhotoURL) {
      updateProfile(user, { photoURL: desiredPhotoURL })
        .then(() => {
          if (firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            setDoc(userDocRef, { photoURL: desiredPhotoURL }, { merge: true });
          }
          // The page will re-render naturally from auth state changes, no need to force it.
        })
        .catch((error) => {
          console.error("Failed to update admin profile picture:", error);
        });
    }

  }, [user, loading, router, adminUid, firestore, desiredPhotoURL]);

  if (loading || !user) {
    // Show a loading skeleton while checking auth state.
    return (
        <div className="container py-8 mx-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                <Skeleton className="w-1/2 h-12" />
                <Skeleton className="w-1/3 h-6" />
                <div className="pt-4 border rounded-md">
                    <Skeleton className="w-full h-48" />
                </div>
            </div>
        </div>
    );
  }

  if (user.uid !== adminUid) {
    // If the user is logged in but is not the admin, show access denied message.
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md mx-auto text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <ShieldAlert className="w-16 h-16 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>
                        You do not have permission to view this page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This area is restricted to administrators only. If you believe this is a mistake, please contact the site owner.
                    </p>
                    { !adminUid && (
                        <p className="font-semibold text-destructive">
                            Admin UID is not configured on the server.
                        </p>
                    )}
                    <Button asChild>
                        <Link href="/">Return to Homepage</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  // If the user is the admin, show the admin content.
  return <>{children}</>;
}
