import { AdminAuthWrapper } from '@/components/auth/admin-auth-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/components/admin/admin-dashboard').then(mod => mod.AdminDashboard), {
  loading: () => <Skeleton className="w-full h-[400px]" />,
  ssr: false
});

export default function AdminPage() {
  return (
    <AdminAuthWrapper>
      <div className="container py-8 mx-auto">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>
              Manage suggestions and assignments submitted by users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
              <AdminDashboard />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}
