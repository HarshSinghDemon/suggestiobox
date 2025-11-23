
'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateGroupForm } from '@/components/p2p-chat/group/create-group-form';

function FormSkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-48" />
            <Skeleton className="w-full h-12" />
        </div>
    );
}


export default function NewGroupPage() {
    return (
        <div className="flex flex-col h-full items-center p-4 sm:p-6 md:p-8">
            <div className="w-full h-full max-w-4xl p-6 rounded-2xl glass-pane">
                 <Suspense fallback={<FormSkeleton />}>
                    <CreateGroupForm />
                </Suspense>
            </div>
        </div>
    );
}

