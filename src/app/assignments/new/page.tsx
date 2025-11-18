import { AssignmentForm } from '@/components/uploads/assignment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewAssignmentPage() {
  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center p-1 rounded-lg bg-muted">
            <Button variant="ghost" asChild>
              <Link href="/suggestions/new">Suggestion</Link>
            </Button>
            <Button variant="ghost" className="bg-background text-foreground" asChild>
              <Link href="/assignments/new">Assignment</Link>
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Upload New Assignment/Lab File</CardTitle>
            <CardDescription>
              Share your assignment files or lab work with the community. A file upload is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignmentForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
