'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ItemCard } from './item-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Suggestion, Assignment } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';

type BrowseSectionProps = {
  activeTab: 'suggestions' | 'assignments';
};

function ItemGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-48" />
                    <Skeleton className="w-3/4 h-6" />
                    <Skeleton className="w-1/2 h-4" />
                </div>
            ))}
      </div>
    )
}


export function BrowseSection({
  activeTab,
}: BrowseSectionProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'suggestions'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assignments'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: suggestions, isLoading: suggestionsLoading } = useCollection<Suggestion>(suggestionsQuery);
  const { data: assignments, isLoading: assignmentsLoading } = useCollection<Assignment>(assignmentsQuery);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs defaultValue={activeTab} className="w-full" onValueChange={handleTabChange}>
      <div className="flex flex-col items-center gap-4 mb-8 md:flex-row">
        <TabsList>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="suggestions">
        {suggestionsLoading ? (
            <ItemGridSkeleton />
        ) : suggestions && suggestions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {suggestions.map((item) => (
              <ItemCard key={item.id} item={item} type="suggestion" />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            No suggestions found.
          </p>
        )}
      </TabsContent>
      <TabsContent value="assignments">
      {assignmentsLoading ? (
          <ItemGridSkeleton />
      ) : assignments && assignments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assignments.map((item) => (
              <ItemCard key={item.id} item={item} type="assignment" />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            No assignments found.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
