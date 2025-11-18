import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Suggestion, Assignment } from '@/lib/types';
import { SubjectIcon } from './subject-icon';

type ItemCardProps =
  | { item: Suggestion; type: 'suggestion' }
  | { item: Assignment; type: 'assignment' };

export function ItemCard({ item, type }: ItemCardProps) {
  const { id, subject, createdAt, userName, userImage } = item;
  const date = createdAt ? createdAt.toDate().toLocaleDateString() : 'N/A';

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2);
  };
  
  const title = item.title;
  const description = type === 'suggestion' ? item.description : `An assignment for the subject: ${subject}`;
  const detailsUrl = `/${type}s/${id}`;

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start gap-4">
          <SubjectIcon subject={subject} className="w-8 h-8 mt-1 text-primary"/>
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">{date}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm line-clamp-3 text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 pt-4 mt-auto border-t">
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={userImage ?? undefined} />
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{userName || 'Anonymous'}</span>
            </div>
            <Badge variant="secondary">{subject}</Badge>
        </div>
        
        <Button asChild className="w-full" variant="outline">
          <Link href={detailsUrl}>
            View Details <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
