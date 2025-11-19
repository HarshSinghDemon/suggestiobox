import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CommunityMembersList } from '@/components/community-members/members-list';
import { Users } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

function MemberListSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))}
        </div>
    )
}


export default function CommunityMembersPage() {
  return (
    <AuthWrapper>
      <div className="container py-12 mx-auto">
        <Card className={cn(
            "max-w-6xl mx-auto opacity-0 animate-fade-in-scale",
            "animation-delay-200"
        )}>
          <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                  <Users className="w-16 h-16 text-primary" />
              </div>
            <CardTitle className="text-3xl">Community Members</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              A list of all the awesome people in our community.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
              <Suspense fallback={<MemberListSkeleton />}>
                  <CommunityMembersList />
              </Suspense>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
