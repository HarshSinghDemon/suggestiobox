import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminAuthWrapper } from '@/components/auth/admin-auth-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
            <AdminDashboard />
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}
