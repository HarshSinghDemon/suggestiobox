import { BookOpenCheck } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <BookOpenCheck className="w-6 h-6 text-primary" />
      <span className="text-lg font-bold tracking-tight font-headline">
        StudyShare Central
      </span>
    </div>
  );
}
