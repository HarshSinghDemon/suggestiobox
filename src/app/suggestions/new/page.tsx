import { SuggestionForm } from '@/components/uploads/suggestion-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

export default function NewSuggestionPage() {
  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <Card className="max-w-2xl mx-auto">
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
    </AuthWrapper>
  );
}
