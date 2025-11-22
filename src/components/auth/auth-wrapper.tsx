
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
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

  return <div className="flex flex-col h-full">{children}</div>;
}
