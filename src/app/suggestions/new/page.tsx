import { SuggestionForm } from '@/components/uploads/suggestion-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewSuggestionPage() {
  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center p-1 rounded-lg bg-muted">
            <Button variant="ghost" className="bg-background text-foreground" asChild>
              <Link href="/suggestions/new">Suggestion</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/assignments/new">Assignment</Link>
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Submit a New Suggestion</CardTitle>
            <CardDescription>
              Share your ideas, notes, or helpful resources with the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuggestionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
