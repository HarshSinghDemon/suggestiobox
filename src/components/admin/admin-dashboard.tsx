'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSuggestionsTable } from './admin-suggestions-table';
import { AdminAssignmentsTable } from './admin-assignments-table';
import { AdminMessagesTable } from './admin-messages-table';

export function AdminDashboard() {
  return (
    <Tabs defaultValue="suggestions" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
      </TabsList>
      <TabsContent value="suggestions">
        <AdminSuggestionsTable />
      </TabsContent>
      <TabsContent value="assignments">
        <AdminAssignmentsTable />
      </TabsContent>
      <TabsContent value="messages">
        <AdminMessagesTable />
      </TabsContent>
    </Tabs>
  );
}
