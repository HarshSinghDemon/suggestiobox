

'use client';

import { useMemo } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ItemCard } from './item-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Suggestion, Assignment, FirebaseUser } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SemesterFilter } from './semester-filter';
import { SubjectFilter } from './subject-filter';
import { SEMESTERS } from '@/lib/constants';

type BrowseSectionProps = {
  activeTab: 'suggestions' | 'assignments';
  activeSemester?: '1st' | '3rd' | '5th';
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
  activeSemester,
  activeSubject,
}: BrowseSectionProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'suggestions'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assignments'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const { data: suggestions, isLoading: suggestionsLoading } = useCollection<Suggestion>(suggestionsQuery);
  const { data: assignments, isLoading: assignmentsLoading } = useCollection<Assignment>(assignmentsQuery);
  const { data: users, isLoading: usersLoading } = useCollection<FirebaseUser>(usersQuery);

  const usersMap = useMemo(() => {
    if (!users) return new Map<string, FirebaseUser>();
    return new Map(users.map(u => [u.id, u]));
  }, [users]);


  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    return suggestions.filter(item => {
        const semesterMatch = !activeSemester || item.semester === activeSemester;
        const subjectMatch = !activeSubject || item.subject === activeSubject;
        return semesterMatch && subjectMatch;
    });
  }, [suggestions, activeSemester, activeSubject]);

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter(item => {
        const semesterMatch = !activeSemester || item.semester === activeSemester;
        const subjectMatch = !activeSubject || item.subject === activeSubject;
        return semesterMatch && subjectMatch;
    });
  }, [assignments, activeSemester, activeSubject]);


  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    params.set('tab', value);
    if (activeSemester) {
      params.set('semester', activeSemester);
    }
     if (activeSubject) {
      params.set('subject', activeSubject);
    }
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const variants: ('default' | 'fiery' | 'ocean')[] = ['default', 'fiery', 'ocean'];
  const getRandomVariant = () => variants[Math.floor(Math.random() * variants.length)];

  return (
    <Tabs defaultValue={activeTab} className="w-full" onValueChange={handleTabChange}>
      <div className="flex flex-col items-center gap-4 mb-8 md:flex-row">
        <TabsList>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        <div className="flex flex-col w-full gap-2 md:flex-row md:w-auto">
            <SemesterFilter />
            <SubjectFilter activeSemester={activeSemester} />
        </div>
      </div>
      <TabsContent value="suggestions">
        {suggestionsLoading || usersLoading ? (
            <ItemGridSkeleton />
        ) : filteredSuggestions && filteredSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSuggestions.map((item) => (
              <ItemCard key={item.id} item={item} type="suggestion" variant={getRandomVariant()} author={usersMap.get(item.userId)} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            No suggestions found for this filter.
          </p>
        )}
      </TabsContent>
      <TabsContent value="assignments">
      {assignmentsLoading || usersLoading ? (
          <ItemGridSkeleton />
      ) : filteredAssignments && filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAssignments.map((item) => (
              <ItemCard key={item.id} item={item} type="assignment" variant={getRandomVariant()} author={usersMap.get(item.userId)} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            No assignments found for this filter.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
