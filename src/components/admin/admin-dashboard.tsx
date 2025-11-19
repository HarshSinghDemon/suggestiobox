'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSuggestionsTable } from './admin-suggestions-table';
import { AdminAssignmentsTable } from './admin-assignments-table';
import { AdminMessagesTable } from './admin-messages-table';
import { AdminUsersTable } from './admin-users-table';

type AdminDashboardProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function AdminDashboard({ supabaseUrl, supabaseAnonKey }: AdminDashboardProps) {
  return (
    <Tabs defaultValue="suggestions" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>
      <TabsContent value="suggestions">
        <AdminSuggestionsTable supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
      </TabsContent>
      <TabsContent value="assignments">
        <AdminAssignmentsTable supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
      </TabsContent>
      <TabsContent value="messages">
        <AdminMessagesTable />
      </TabsContent>
      <TabsContent value="users">
        <AdminUsersTable />
      </TabsContent>
    </Tabs>
  );
}
