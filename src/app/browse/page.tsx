import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const BrowseSection = dynamic(() => import('@/components/browse/browse-section').then(mod => mod.BrowseSection), {
  loading: () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <Skeleton className="h-10 w-[200px]" />
        <div className="w-full md:w-auto md:ml-auto">
          <Skeleton className="h-10 w-full md:w-[240px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="w-3/4 h-6" />
            <Skeleton className="w-1/2 h-4" />
          </div>
        ))}
      </div>
    </div>
  ),
});


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
      <Suspense fallback={<p>Loading...</p>}>
        <BrowseSection activeTab={tab} activeSubject={subject} />
      </Suspense>
    </div>
  );
}
