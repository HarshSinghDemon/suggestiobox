
import { SuggestionDetails } from '@/components/details/suggestion-details';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

type SuggestionPageProps = {
  params: {
    id: string;
  };
};

export default function SuggestionPage({ params }: SuggestionPageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
