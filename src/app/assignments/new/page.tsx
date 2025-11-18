import { AssignmentForm } from '@/components/uploads/assignment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewAssignmentPage() {
  return (
    <div className="container py-8 mx-auto">
      <Card className="max-w-2xl mx-auto">
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
  );
}
