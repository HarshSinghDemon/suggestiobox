import { SuggestionDetails } from '@/components/details/suggestion-details';

type SuggestionPageProps = {
  params: {
    id: string;
  };
};

export default function SuggestionPage({ params }: SuggestionPageProps) {
  return (
    <div className="container py-8 mx-auto">
      <SuggestionDetails suggestionId={params.id} />
    </div>
  );
}
