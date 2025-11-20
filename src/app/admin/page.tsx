
import { AdminAuthWrapper } from '@/components/auth/admin-auth-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminProfileSettings } from '@/components/admin/admin-profile-settings';

const AdminDashboard = dynamic(() => import('@/components/admin/admin-dashboard').then(mod => mod.AdminDashboard), {
  loading: () => <Skeleton className="w-full h-[400px]" />,
});

export default function AdminPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pageContent = (
    !supabaseUrl || !supabaseAnonKey ? (
        <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
                Supabase URL or Anonymous Key is not configured in your environment variables. Deleting items with files will fail. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.
            </AlertDescription>
        </Alert>
    ) : (
      <div className="space-y-8">
        <AdminProfileSettings supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
        <Card>
          <CardHeader>
            <CardTitle>User & Content Management</CardTitle>
            <CardDescription>
              Manage suggestions, assignments, messages, and users.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
                <AdminDashboard supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    )
  );


  return (
    <AdminAuthWrapper>
      <div className="container py-8 mx-auto md:px-4">
        <div className="w-full mx-auto md:max-w-6xl">
          <div className='px-4 mb-6 md:px-0'>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">Oversee and manage the application's content and users.</p>
          </div>
          {pageContent}
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
