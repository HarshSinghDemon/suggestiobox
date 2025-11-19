
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SEMESTERS } from '@/lib/constants';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function SemesterFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSemesterChange = (semester: string) => {
    const params = new URLSearchParams(searchParams);
    if (semester && semester !== 'all') {
      params.set('semester', semester);
    } else {
      params.delete('semester');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      onValueChange={handleSemesterChange}
      defaultValue={searchParams.get('semester') || 'all'}
    >
      <SelectTrigger className="w-full md:w-[240px]">
        <SelectValue placeholder="Filter by semester..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Semesters</SelectItem>
        {SEMESTERS.map((semester) => (
          <SelectItem key={semester} value={semester}>
            {semester}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
