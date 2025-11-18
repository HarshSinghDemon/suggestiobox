'use client';

import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut, PlusCircle, Upload, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Logo } from '../logo';
import { useAuth as useFirebaseAuth } from '@/firebase';

export function Header() {
  const { user } = useAuth();
  const firebaseAuth = useFirebaseAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(firebaseAuth);
    router.push('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names
      .map((n) => n[0])
      .join('')
      .substring(0, 2);
  };
  
  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-transparent">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        <nav className="hidden gap-6 md:flex">
            <Link
                href="/browse"
                className="text-sm font-medium transition-colors text-foreground/60 hover:text-foreground/80"
            >
                Browse
            </Link>
            <Link
                href="/suggestions/new"
                className="text-sm font-medium transition-colors text-foreground/60 hover:text-foreground/80"
            >
                Upload Suggestion
            </Link>
            <Link
                href="/assignments/new"
                className="text-sm font-medium transition-colors text-foreground/60 hover:text-foreground/80"
            >
                Upload Assignment
            </Link>
        </nav>
        <div className="flex items-center justify-end flex-1 ml-auto">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative w-8 h-8 rounded-full"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/suggestions/new')}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>New Suggestion</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/assignments/new')}>
                  <Upload className="w-4 h-4 mr-2" />
                  <span>New Assignment</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-2" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
