import { AdminAuthWrapper } from '@/components/auth/admin-auth-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const AdminDashboard = dynamic(() => import('@/components/admin/admin-dashboard').then(mod => mod.AdminDashboard), {
  loading: () => <Skeleton className="w-full h-[400px]" />,
});

export default function AdminPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                  Supabase URL or Anonymous Key is not configured in your environment variables. Deleting items with files will fail. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </AdminAuthWrapper>
    );
  }

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
              <AdminDashboard supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}
