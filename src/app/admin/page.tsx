
import { AdminAuthWrapper } from '@/components/auth/admin-auth-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { AdminProfileSettings } from '@/components/admin/admin-profile-settings';

const AdminDashboard = dynamic(() => import('@/components/admin/admin-dashboard').then(mod => mod.AdminDashboard), {
  loading: () => <Skeleton className="w-full h-[400px]" />,
});

export default function AdminPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const renderContent = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        return (
            <Alert variant="destructive" className="mt-8">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                    Supabase URL or Anonymous Key is not configured in your environment variables. Deleting items with files will fail. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-8 mt-8">
            <AdminProfileSettings supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
            <Card>
                <CardHeader>
                    <CardTitle>User & Content Management</CardTitle>
                    <CardDescription>
                    Oversee and manage the application's content and users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
                        <AdminDashboard supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <AdminAuthWrapper>
      <div className="container py-8 mx-auto md:px-4">
        <div className="w-full mx-auto md:max-w-6xl">
             <Card className="overflow-hidden bg-gradient-to-br from-card to-destructive/10">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/20 to-destructive/20 border border-destructive/30">
                         <ShieldAlert className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Admin Dashboard</CardTitle>
                        <CardDescription className="text-destructive-foreground/70">
                            Power to oversee and manage the application's content and users.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
            {renderContent()}
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
