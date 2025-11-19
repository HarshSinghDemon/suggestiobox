
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
import { LogIn, LogOut, PlusCircle, Upload, Shield, Info, Users, Compass, MessageSquare, Trophy, ChevronDown, Gamepad2, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Logo } from '../logo';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
import { useState } from 'react';
import { JukeboxControls } from '../jukebox-controls';
import { Separator } from '../ui/separator';

const ADMIN_EMAIL = 'harshroop100@gmail.com';

const NavLink = ({ href, children, onNavigate }: { href: string, children: React.ReactNode, onNavigate: () => void }) => {
    const router = useRouter();
    return (
        <button
            onClick={() => {
                router.push(href);
                onNavigate();
            }}
            className="flex items-center w-full px-4 py-2 text-lg font-medium text-left rounded-md text-foreground/80 hover:bg-accent"
        >
            {children}
        </button>
    )
}

export function Header() {
  const { user } = useAuth();
  const firebaseAuth = useFirebaseAuth();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
  
  const isAdmin = user?.email === ADMIN_EMAIL;

  const UserAvatarButton = () => (
    <Button variant="ghost" className="relative w-10 h-10 rounded-full">
        <Avatar className="w-8 h-8">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
    </Button>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center h-16">
        <div className="mr-4 md:mr-6">
          <Link href="/" className="flex items-center space-x-2" prefetch={true}>
            <Logo />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="items-center hidden gap-6 text-sm md:flex">
            <Link
                href="/browse"
                className="font-medium transition-colors text-foreground/60 hover:text-foreground/80"
                prefetch={false}
            >
                Browse
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 font-medium transition-colors text-foreground/60 hover:text-foreground/80 focus:outline-none">
                  Community
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => router.push('/community-chat')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Community Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/community-members')}>
                  <Users className="w-4 h-4 mr-2" />
                  Community Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/community-game')}>
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Community Games
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
                href="/pookie-contributors"
                className="font-medium transition-colors text-foreground/60 hover:text-foreground/80"
                prefetch={false}
            >
                Pookie Contributors
            </Link>
            <Link
                href="/suggestions/new"
                className="font-medium transition-colors text-foreground/60 hover:text-foreground/80"
                prefetch={false}
            >
                Upload
            </Link>
             <Link
                href="/about-site"
                className="font-medium transition-colors text-foreground/60 hover:text-foreground/80"
                prefetch={false}
            >
                About
            </Link>
        </nav>

        <div className="flex items-center justify-end flex-1 ml-auto">
            <div className="flex items-center gap-1 md:gap-2">
              <JukeboxControls />
              {user ? (
                <div className="relative group">
                   <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <UserAvatarButton />
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
                        <DropdownMenuItem onClick={() => router.push('/browse')}><Compass className="w-4 h-4 mr-2" /><span>Browse</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/suggestions/new')}><PlusCircle className="w-4 h-4 mr-2" /><span>New Suggestion</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/assignments/new')}><Upload className="w-4 h-4 mr-2" /><span>New Assignment</span></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isAdmin && (<DropdownMenuItem onClick={() => router.push('/admin')}><Shield className="w-4 h-4 mr-2" /><span>Admin Panel</span></DropdownMenuItem>)}
                        <DropdownMenuItem onClick={() => router.push('/about-site')}><Info className="w-4 h-4 mr-2" /><span>About This Site</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/about-admin')}><Users className="w-4 h-4 mr-2" /><span>About Admin</span></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}><LogOut className="w-4 h-4 mr-2" /><span>Log out</span></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                   </div>
                   <div className="block md:hidden">
                        <Button variant="ghost" className="relative w-10 h-10 rounded-full">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                        </Button>
                   </div>
                </div>
              ) : (
                <Button asChild className="hidden md:flex ml-2">
                  <Link href="/login">
                    <LogIn className="w-4 h-4 mr-2" /> Login
                  </Link>
                </Button>
              )}
            </div>

          {/* Mobile Navigation Trigger */}
          <div className="ml-2 md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="w-6 h-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs p-0 bg-background/95 backdrop-blur-lg">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b">
                           <Logo />
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon">
                                    <X className="w-6 h-6" />
                                </Button>
                            </SheetClose>
                        </div>

                        {user && (
                            <div className="p-4 border-b">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="font-semibold">{user.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <nav className="flex flex-col p-4 space-y-2">
                           <NavLink href="/browse" onNavigate={() => setIsSheetOpen(false)}>
                                <Compass className="w-5 h-5 mr-3" /> Browse
                           </NavLink>
                            <NavLink href="/community-chat" onNavigate={() => setIsSheetOpen(false)}>
                                <MessageSquare className="w-5 h-5 mr-3" /> Community Chat
                            </NavLink>
                            <NavLink href="/community-members" onNavigate={() => setIsSheetOpen(false)}>
                                <Users className="w-5 h-5 mr-3" /> Members
                            </NavLink>
                            <NavLink href="/community-game" onNavigate={() => setIsSheetOpen(false)}>
                                <Gamepad2 className="w-5 h-5 mr-3" /> Games
                            </NavLink>
                            <NavLink href="/pookie-contributors" onNavigate={() => setIsSheetOpen(false)}>
                                <Trophy className="w-5 h-5 mr-3" /> Contributors
                            </NavLink>
                            <NavLink href="/suggestions/new" onNavigate={() => setIsSheetOpen(false)}>
                                <PlusCircle className="w-5 h-5 mr-3" /> Upload
                            </NavLink>
                             <NavLink href="/about-site" onNavigate={() => setIsSheetOpen(false)}>
                                <Info className="w-5 h-5 mr-3" /> About Site
                            </NavLink>
                            <NavLink href="/about-admin" onNavigate={() => setIsSheetOpen(false)}>
                                <Users className="w-5 h-5 mr-3" /> About Admin
                            </NavLink>
                            {isAdmin && (
                                <NavLink href="/admin" onNavigate={() => setIsSheetOpen(false)}>
                                    <Shield className="w-5 h-5 mr-3" /> Admin
                                </NavLink>
                            )}
                        </nav>
                        <div className="p-4 mt-auto border-t">
                            {user ? (
                                <Button variant="outline" className="w-full" onClick={() => { handleSignOut(); setIsSheetOpen(false); }}>
                                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                </Button>
                            ) : (
                                <Button asChild className="w-full" onClick={() => setIsSheetOpen(false)}>
                                    <Link href="/login">
                                        <LogIn className="w-4 h-4 mr-2" /> Login
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
