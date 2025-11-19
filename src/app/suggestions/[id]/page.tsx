import { SuggestionDetails } from '@/components/details/suggestion-details';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

type SuggestionPageProps = {
  params: {
    id: string;
  };
};

export default function SuggestionPage({ params }: SuggestionPageProps) {
  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <SuggestionDetails suggestionId={params.id} />
      </div>
    </AuthWrapper>
  );
}
