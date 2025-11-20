
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
      <div className="overflow-x-auto">
        <TabsList className="inline-flex items-center justify-start w-full min-w-max md:grid md:grid-cols-4">
          <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
          <TabsTrigger value="assignments" className="flex-1">Assignments</TabsTrigger>
          <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
          <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
        </TabsList>
      </div>
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
