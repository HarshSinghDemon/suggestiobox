'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { SubjectFilter } from './subject-filter';
import type { Subject } from '@/lib/constants';
import { ItemCard } from './item-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Suggestion, Assignment } from '@/lib/types';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

type BrowseSectionProps = {
  activeTab: 'suggestions' | 'assignments';
  activeSubject?: string;
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
  activeSubject,
}: BrowseSectionProps) {
  const firestore = useFirestore();
  const subjectTyped = activeSubject as Subject | undefined;

  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const baseQuery = query(collection(firestore, 'suggestions'), orderBy('createdAt', 'desc'), limit(50));
    if (subjectTyped) {
        return query(baseQuery, where('subject', '==', subjectTyped));
    }
    return baseQuery;
  }, [firestore, subjectTyped]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const baseQuery = query(collection(firestore, 'assignments'), orderBy('createdAt', 'desc'), limit(50));
    if (subjectTyped) {
        return query(baseQuery, where('subject', '==', subjectTyped));
    }
    return baseQuery;
  }, [firestore, subjectTyped]);

  const { data: suggestions, isLoading: suggestionsLoading } = useCollection<Suggestion>(suggestionsQuery);
  const { data: assignments, isLoading: assignmentsLoading } = useCollection<Assignment>(assignmentsQuery);

  return (
    <Tabs defaultValue={activeTab} className="w-full">
      <div className="flex flex-col items-center gap-4 mb-8 md:flex-row">
        <TabsList>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        <div className="w-full md:w-auto md:ml-auto">
          <SubjectFilter activeTab={activeTab} activeSubject={activeSubject} />
        </div>
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
            No suggestions found for this subject.
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
            No assignments found for this subject.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}