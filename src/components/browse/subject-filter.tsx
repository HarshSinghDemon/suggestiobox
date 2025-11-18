'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUBJECTS } from '@/lib/constants';
import { useRouter, usePathname } from 'next/navigation';

type SubjectFilterProps = {
  activeTab: 'suggestions' | 'assignments';
  activeSubject?: string;
};

export function SubjectFilter({ activeTab, activeSubject }: SubjectFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSubjectChange = (subject: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (subject && subject !== 'all') {
      params.set('subject', subject);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleSubjectChange} defaultValue={activeSubject || 'all'}>
      <SelectTrigger className="w-full md:w-[240px]">
        <SelectValue placeholder="Filter by subject..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Subjects</SelectItem>
        {SUBJECTS.map((subject) => (
          <SelectItem key={subject} value={subject}>
            {subject}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
