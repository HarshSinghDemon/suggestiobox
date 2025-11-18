'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;

  useEffect(() => {
    if (!adminUid) {
        console.error("Admin UID is not configured. Set NEXT_PUBLIC_ADMIN_UID in your environment variables.");
        router.push('/');
        return;
    }

    if (!loading) {
      if (!user || user.uid !== adminUid) {
        router.push('/');
      }
    }
  }, [user, loading, router, adminUid]);

  if (loading || !user || user.uid !== adminUid) {
    return (
        <div className="container py-8 mx-auto">
            <div className="max-w-2xl mx-auto space-y-6">
                <Skeleton className="w-3/4 h-10" />
                <Skeleton className="w-full h-8" />
                <div className="space-y-8 pt-4">
                    <Skeleton className="w-full h-24" />
                    <Skeleton className="w-full h-24" />
                    <Skeleton className="w-full h-12" />
                </div>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}
