
'use client';

import { FirebaseUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, ShieldCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfilePopoverProps {
  user: FirebaseUser;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
};

const YearBadge = ({ year }: { year: '1st' | '2nd' | '3rd' | undefined }) => {
  if (!year) return null;

  switch (year) {
    case '1st':
      return (
        <Badge className="border-transparent bg-gradient-to-r from-green-400/30 to-blue-500/30 text-green-300 transition-all hover:shadow-green-500/20 hover:scale-105">
          <Star className="w-3 h-3 mr-1" />
          Junior
        </Badge>
      );
    case '2nd':
      return (
        <Badge className="border-transparent bg-gradient-to-r from-amber-400/30 to-orange-500/30 text-amber-300 animate-pulse-slow transition-all hover:shadow-amber-500/20 hover:scale-105">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Senior
        </Badge>
      );
    case '3rd':
      return (
        <Badge className="border-transparent animate-super-senior-shine text-purple-200 transition-all hover:shadow-purple-400/30 hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2L9 9l-7 2.5 7 2.5 3 6.5 3-6.5 7-2.5-7-2.5L12 2z"/><path d="M18 9l-2.25 4.75L12 15l-3.75-1.25L6 9"/><path d="M12 15l3 6.5 3-6.5"/></svg>
          Super Senior
        </Badge>
      );
    default:
      return null;
  }
};


export function UserProfilePopover({ user }: UserProfilePopoverProps) {
  if (!user) return null;
  
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Avatar className="w-24 h-24 border-4 border-primary/50">
        <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User Avatar'} />
        <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="text-lg font-semibold">{user.displayName}</h3>
        <div className="mt-1">
          <YearBadge year={user.year} />
        </div>
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
