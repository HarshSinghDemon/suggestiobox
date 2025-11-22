
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Search, Edit } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FriendsList } from "./friends-list";
import { FindFriendsList } from "./find-friends-list";
import { Logo } from '../logo';

export function ChatHeader({ children }: { children?: React.ReactNode }) {
    return (
        <header className="flex flex-col h-auto p-4 shrink-0">
            <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                   <div className="flex items-center gap-2 group">
                      <div className="w-7 h-7 flex flex-col items-center justify-center rounded-md bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-orange-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]"><path d="M9 18h6v2H9z" /><path d="M10 16h4v2h-4z" /><path d="M8 11h2v5H8z" /><path d="M14 11h2v5h-2z" /><path d="M6 8h2v3H6z" /><path d="M16 8h2v3h-2z" /><path d="M8 5h2v3H8z" /><path d="M14 5h2v3h-2z" /><path d="M10 2h4v3h-4z" /></svg>
                      </div>
                      <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                        Private Space
                      </span>
                    </div>
                </Link>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <LogOut className="w-5 h-5" />
                        </Link>
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Edit className="w-5 h-5"/>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="p-0 border-0 max-w-md">
                            <Tabs defaultValue="friends" className="w-full">
                                <DialogHeader className="p-4 border-b">
                                    <DialogTitle>Manage Friends</DialogTitle>
                                    <TabsList className="grid w-full grid-cols-2 mt-2">
                                        <TabsTrigger value="friends">Friends</TabsTrigger>
                                        <TabsTrigger value="find">Find</TabsTrigger>
                                    </TabsList>
                                </DialogHeader>
                                <TabsContent value="friends" className="m-0">
                                    <FriendsList />
                                </TabsContent>
                                <TabsContent value="find" className="m-0">
                                    <FindFriendsList />
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                    {children}
                </div>
            </div>
        </header>
    );
}
