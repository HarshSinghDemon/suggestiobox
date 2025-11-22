
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
import { LogIn, LogOut, PlusCircle, Upload, Shield, Info, Users, Compass, MessageSquare, Trophy, ChevronDown, Gamepad2, Menu, X, Music, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Logo } from '../logo';
import { useAuth as useFirebaseAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ProfileAvatarModal } from '../profile-avatar-modal';
import { MiniMusicPlayer } from './mini-music-player';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useAudio } from './audio-provider';
import { Skeleton } from '../ui/skeleton';
import { NotificationPanel } from './notification-panel';
import type { Notification, ChatRoom } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const ADMIN_EMAILS = ['harshroop100@gmail.com', '15mondalatrik@gmail.com'];

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

function GoldenDot() {
    return (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-amber-400"></span>
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-amber-500"></span>
        </span>
    );
}


function NotificationBell() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const previousUnreadCount = useRef(0);
    const isInitialLoad = useRef(true);

    const notificationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'notifications'),
            where('isRead', '==', false)
        );
    }, [user, firestore]);

    const { data: unreadNotifications, isLoading } = useCollection<Notification>(notificationsQuery);
    const unreadCount = unreadNotifications?.length ?? 0;
    
    useEffect(() => {
        if (isLoading) return;

        // On initial load, just set the count and do nothing.
        if (isInitialLoad.current) {
            previousUnreadCount.current = unreadCount;
            isInitialLoad.current = false;
            return;
        }

        // If a new notification has arrived after the initial load, open the panel.
        if (unreadCount > previousUnreadCount.current) {
            setIsPanelOpen(true);
        }
        
        // Always update the previous count for the next comparison.
        previousUnreadCount.current = unreadCount;
    }, [unreadCount, isLoading]);


    return (
        <Popover open={isPanelOpen} onOpenChange={setIsPanelOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && !isLoading && <GoldenDot />}
                    {isLoading && <Skeleton className="absolute top-1 right-1 w-5 h-5 rounded-full" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <NotificationPanel />
            </PopoverContent>
        </Popover>
    )
}


export function Header() {
  const { user, loading: isAuthLoading } = useAuth();
  const firebaseAuth = useFirebaseAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { isPlaying } = useAudio();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Unread messages logic
  const chatRoomsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(collection(firestore, 'chatRooms'), where('participants', 'array-contains', user.uid));
  }, [user?.uid, firestore]);

  const { data: chatRooms, isLoading: isLoadingChatRooms } = useCollection<ChatRoom>(chatRoomsQuery);
  
  const hasUnreadMessages = useMemo(() => {
    if (!chatRooms || !user?.uid) return false;
    return chatRooms.some(room => {
        const lastMessageTimestamp = room.lastMessage?.timestamp;
        // No last message means no unread messages.
        if (!lastMessageTimestamp) return false;
        
        // If the current user sent the last message, it's not "unread" for them.
        if (room.lastMessage.senderId === user.uid) return false;

        const lastReadTimestamp = room.lastRead?.[user.uid];
        // If the user has never read this chat, it's unread.
        if (!lastReadTimestamp) return true;

        // Compare timestamps. If last message is newer than last read, it's unread.
        return lastMessageTimestamp.toMillis() > lastReadTimestamp.toMillis();
    });
}, [chatRooms, user?.uid]);


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
  
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const UserAvatarButton = () => (
     <Button 
        variant="ghost" 
        className="relative w-10 h-10 rounded-full"
        onClick={() => setIsAvatarModalOpen(true)}
        aria-label="Open profile modal"
    >
        <Avatar className="w-8 h-8">
            <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'User'} />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
        </Avatar>
    </Button>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2" prefetch={true}>
            <Logo />
          </Link>
        </div>
        
        <div className="flex items-center gap-1">
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
                    <button className="relative flex items-center gap-1 font-medium transition-colors text-foreground/60 hover:text-foreground/80 focus:outline-none">
                      Community
                      <ChevronDown className="w-4 h-4" />
                       {hasUnreadMessages && !isLoadingChatRooms && <GoldenDot />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => router.push('/community-chat')}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Community Chat
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => router.push('/messages')} className="relative">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Private Messages
                      {hasUnreadMessages && <GoldenDot />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/community-members')}>
                      <Users className="w-4 h-4 mr-2" />
                      Community Members
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/community-game')}>
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      Community Games
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/jokebox')}>
                        <Music className="w-4 h-4 mr-2" />
                        Jokebox
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 font-medium transition-colors text-foreground/60 hover:text-foreground/80 focus:outline-none">
                      About
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => router.push('/about-site')}>
                      <Info className="w-4 h-4 mr-2" />
                      About This Site
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/about-admin')}>
                      <Users className="w-4 h-4 mr-2" />
                      About The Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </nav>

            <div className="flex items-center">
              {isAuthLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className={cn("w-24 h-10", !user && "hidden md:block")} />
                  <Skeleton className="w-10 h-10 rounded-full" />
                </div>
              ) : user ? (
                <div className="flex items-center gap-1">
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex"
                            onClick={() => router.push('/admin')}
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Admin
                        </Button>
                    )}
                    <NotificationBell />
                    <div className="hidden md:flex">
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
                            <DropdownMenuItem onClick={() => setIsAvatarModalOpen(true)}><Users className="w-4 h-4 mr-2" /><span>Change Avatar</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/browse')}><Compass className="w-4 h-4 mr-2" /><span>Browse</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/suggestions/new')}><PlusCircle className="w-4 h-4 mr-2" /><span>New Suggestion</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/assignments/new')}><Upload className="w-4 h-4 mr-2" /><span>New Assignment</span></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isAdmin && (<DropdownMenuItem onClick={() => router.push('/admin')}><Shield className="w-4 h-4 mr-2" /><span>Admin Panel</span></DropdownMenuItem>)}
                            <DropdownMenuItem onClick={() => router.push('/about-site')}><Info className="w-4 h-4 mr-2" /><span>About This Site</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/about-admin')}><Users className="w-4 h-4 mr-2" /><span>About Admin</span></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                              <LogOut className="w-4 h-4 mr-2" />
                              <span>Log out</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <ProfileAvatarModal isOpen={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen} />
          
            {/* Common controls for both mobile and desktop */}
            <Popover>
              <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <Music className={cn("w-5 h-5", isPlaying ? "animate-music-glow" : "")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <MiniMusicPlayer />
              </PopoverContent>
            </Popover>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="w-6 h-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs p-0 bg-background/80 backdrop-blur-lg">
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
                            <button
                                className="w-full p-4 text-left border-b hover:bg-accent"
                                onClick={() => {
                                setIsAvatarModalOpen(true);
                                setIsSheetOpen(false);
                                }}
                            >
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
                            </button>
                        )}

                        <nav className="flex flex-col p-4 space-y-2">
                           <NavLink href="/browse" onNavigate={() => setIsSheetOpen(false)}>
                                <Compass className="w-5 h-5 mr-3" /> Browse
                           </NavLink>
                            <NavLink href="/community-chat" onNavigate={() => setIsSheetOpen(false)}>
                                <MessageSquare className="w-5 h-5 mr-3" /> Community Chat
                            </NavLink>
                            <NavLink href="/messages" onNavigate={() => setIsSheetOpen(false)}>
                                <div className="relative flex items-center w-full">
                                    <MessageSquare className="w-5 h-5 mr-3" />
                                    Private Messages
                                    {hasUnreadMessages && <GoldenDot />}
                                </div>
                            </NavLink>
                            <NavLink href="/community-members" onNavigate={() => setIsSheetOpen(false)}>
                                <Users className="w-5 h-5 mr-3" /> Members
                            </NavLink>
                            <NavLink href="/community-game" onNavigate={() => setIsSheetOpen(false)}>
                                <Gamepad2 className="w-5 h-5 mr-3" /> Games
                            </NavLink>
                            <NavLink href="/jokebox" onNavigate={() => setIsSheetOpen(false)}>
                                <Music className="w-5 h-5 mr-3" /> Jokebox
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
                                <Button variant="destructive" className="w-full" onClick={() => { handleSignOut(); setIsSheetOpen(false); }}>
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
