
'use client';

import { FirebaseUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfilePopoverProps {
  user: FirebaseUser;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
};

export function UserProfilePopover({ user }: UserProfilePopoverProps) {
  if (!user) return null;
  
  const getYearBadgeClass = (year?: '1st' | '2nd' | '3rd') => cn({
    'border-sky-500/30 bg-sky-500/20 text-sky-400': year === '1st',
    'border-amber-500/30 bg-amber-500/20 text-amber-400': year === '2nd',
    'border-emerald-500/30 bg-emerald-500/20 text-emerald-400': year === '3rd',
  });

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Avatar className="w-24 h-24 border-4 border-primary/50">
        <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User Avatar'} />
        <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="text-lg font-semibold">{user.displayName}</h3>
        {user.year && (
          <Badge variant="outline" className={cn("mt-1", getYearBadgeClass(user.year))}>
            {user.year} Year
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="w-4 h-4" />
        <a href={`mailto:${user.email}`} className="hover:underline">
            {user.email}
        </a>
      </div>
    </div>
  );
}
