
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SEMESTER_SUBJECTS } from '@/lib/constants';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type SubjectFilterProps = {
  activeSemester: '1st' | '3rd' | '5th';
};

export function SubjectFilter({ activeSemester }: SubjectFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSubjectChange = (subject: string) => {
    const params = new URLSearchParams(searchParams);
    if (subject && subject !== 'all') {
      params.set('subject', subject);
    } else {
      params.delete('subject');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const subjects = activeSemester ? SEMESTER_SUBJECTS[activeSemester] : [];

  return (
    <Select
      onValueChange={handleSubjectChange}
      defaultValue={searchParams.get('subject') || 'all'}
      disabled={!activeSemester}
    >
      <SelectTrigger className="w-full md:w-[240px]">
        <SelectValue placeholder="Filter by subject..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Subjects</SelectItem>
        {subjects.map((subject) => (
          <SelectItem key={subject} value={subject}>
            {subject}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
