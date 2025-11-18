import { BrowseSection } from '@/components/browse/browse-section';

type BrowsePageProps = {
  searchParams: {
    tab?: 'suggestions' | 'assignments';
    subject?: string;
  };
};

export default function BrowsePage({ searchParams }: BrowsePageProps) {
  const { tab = 'suggestions', subject } = searchParams;

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h1>
      <BrowseSection activeTab={tab} activeSubject={subject} />
    </div>
  );
}
