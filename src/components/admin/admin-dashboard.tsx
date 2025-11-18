'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSuggestionsTable } from './admin-suggestions-table';
import { AdminAssignmentsTable } from './admin-assignments-table';

export function AdminDashboard() {
  return (
    <Tabs defaultValue="suggestions" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
      </TabsList>
      <TabsContent value="suggestions">
        <AdminSuggestionsTable />
      </TabsContent>
      <TabsContent value="assignments">
        <AdminAssignmentsTable />
      </TabsContent>
    </Tabs>
  );
}
