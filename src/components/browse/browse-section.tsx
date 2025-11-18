import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { SubjectFilter } from './subject-filter';
import { getSuggestions, getAssignments } from '@/lib/firebase/firestore';
import type { Subject } from '@/lib/constants';
import { ItemCard } from './item-card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

type BrowseSectionProps = {
  activeTab: 'suggestions' | 'assignments';
  activeSubject?: string;
};

export async function BrowseSection({
  activeTab,
  activeSubject,
}: BrowseSectionProps) {
  const subjectTyped = activeSubject as Subject | undefined;
  const [suggestions, assignments] = await Promise.all([
    getSuggestions(subjectTyped),
    getAssignments(subjectTyped),
  ]);

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
        {suggestions.length > 0 ? (
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
      {assignments.length > 0 ? (
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
