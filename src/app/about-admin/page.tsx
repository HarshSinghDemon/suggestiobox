
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Loader2, UserX } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { FirebaseUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

function AdminProfileSkeleton() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <div className="relative flex justify-center mb-4">
                    <Skeleton className="w-24 h-24 rounded-full md:w-28 md:h-28" />
                </div>
                <Skeleton className="w-48 h-8 mx-auto" />
                <Skeleton className="w-32 h-6 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="mt-4 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-full h-4" />
                </div>
                <div className="pt-4 space-y-4 border-t">
                    <Skeleton className="w-40 h-6 mx-auto" />
                    <div className="flex items-center justify-center gap-4">
                        <Skeleton className="w-5 h-5" />
                        <Skeleton className="w-48 h-5" />
                    </div>
                     <div className="flex items-center justify-center gap-4">
                        <Skeleton className="w-5 h-5" />
                        <Skeleton className="w-32 h-5" />
                    </div>
                     <div className="flex items-center justify-center gap-4">
                        <Skeleton className="w-5 h-5" />
                        <Skeleton className="w-36 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export default function AboutAdminPage() {
    const firestore = useFirestore();
    const adminQuery = useMemoFirebase(
      () =>
        firestore
          ? query(collection(firestore, 'users'), where('email', '==', 'harshroop100@gmail.com'), where('role', '==', 'admin'))
          : null,
      [firestore]
    );

    const { data: adminUsers, isLoading } = useCollection<FirebaseUser>(adminQuery);
    const adminUser = adminUsers?.[0];

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'A';
        return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
    };

    if (isLoading) {
        return (
            <div className="container py-8 mx-auto md:py-12">
                <AdminProfileSkeleton />
            </div>
        );
    }
    
    if (!adminUser) {
        return (
             <div className="container py-8 mx-auto md:py-12">
                <Card className="max-w-2xl mx-auto text-center">
                    <CardHeader>
                        <UserX className="w-16 h-16 mx-auto text-destructive" />
                        <CardTitle>Admin Not Found</CardTitle>
                        <CardDescription>The administrator profile could not be loaded.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

  return (
    <div className="container py-8 mx-auto md:py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="relative flex justify-center mb-4">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-yellow-500 to-primary opacity-75 blur-sm transition duration-500 group-hover:opacity-100 group-hover:duration-200 animate-tilt"></div>
            <div className="relative inline-block p-1 bg-background rounded-full">
                <Avatar className="w-24 h-24 md:w-28 md:h-28">
                    <AvatarImage src='https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/profile%20photos/124599.jpg' alt={adminUser.displayName ?? 'Admin'} />
                    <AvatarFallback>{getInitials(adminUser.displayName)}</AvatarFallback>
                </Avatar>
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">{adminUser.displayName}</CardTitle>
          <CardDescription className="text-base md:text-lg text-muted-foreground">
            Site Administrator & Creator
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-6">
          <p className="text-center text-foreground/80">
            Harsh is the passionate developer behind this platform, dedicated to building helpful tools for the community. He is committed to ensuring a safe, valuable, and seamless experience for all users.
          </p>
          <div className="pt-4 space-y-4 border-t">
            <h3 className="text-lg font-semibold text-center md:text-xl">Contact Information</h3>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <a href={`mailto:${adminUser.email}`} className="text-sm font-medium md:text-base hover:underline">
                {adminUser.email}
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <Phone className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <a href="tel:8210294946" className="text-sm font-medium md:text-base hover:underline">
                8210294946
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <InstagramIcon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <a 
                href="https://www.instagram.com/specifichxrsh" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm font-medium md:text-base hover:underline"
              >
                @specifichxrsh
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
