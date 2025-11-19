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
import { cn } from '@/lib/utils';

type ItemCardProps = {
  item: Suggestion | Assignment;
  type: 'suggestion' | 'assignment';
  variant?: 'default' | 'fiery' | 'ocean';
};

export function ItemCard({ item, type, variant = 'default' }: ItemCardProps) {
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
    <Card className={cn(
      "flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 group",
      variant === 'default' && "hover:border-primary/50",
      variant === 'fiery' && "bg-gradient-to-br from-yellow-400/10 via-orange-500/10 to-red-600/10 border-orange-500/30 hover:border-orange-400 hover:shadow-orange-500/20",
      variant === 'ocean' && "bg-gradient-to-br from-blue-400/10 via-violet-500/10 to-purple-600/10 border-blue-500/30 hover:border-blue-400 hover:shadow-blue-500/20"
    )}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <SubjectIcon subject={subject} className={cn("w-8 h-8 mt-1", variant === 'fiery' ? 'text-orange-400' : variant === 'ocean' ? 'text-blue-400' : 'text-primary')}/>
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
          <Link href={detailsUrl} prefetch={true}>
            View Details <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
