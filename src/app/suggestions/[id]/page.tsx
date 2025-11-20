
import { SuggestionDetails } from '@/components/details/suggestion-details';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type SuggestionPageProps = {
  params: {
    id: string;
  };
};

export default function SuggestionPage({ params }: SuggestionPageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <AuthWrapper>
        <div className="container py-8 mx-auto">
          <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                  Supabase URL or Anonymous Key is not configured. Deletion will not be possible.
              </AlertDescription>
          </Alert>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <SuggestionDetails 
            suggestionId={params.id}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
        />
      </div>
    </AuthWrapper>
  );
}
