
'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';

export function RootLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isChatPage = pathname.startsWith('/messages');

    return (
        <div className="relative flex min-h-dvh flex-col">
            <Header />
            <main className={cn('flex-1', !isChatPage && 'pb-24')}>
                {children}
            </main>
        </div>
    );
}
