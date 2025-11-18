import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PookieContributorsList } from '@/components/contributors/pookie-contributors-list';
import { Trophy } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ContributorListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="w-12 h-6" />
                </div>
            ))}
        </div>
    )
}


export default function PookieContributorsPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-primary" />
            </div>
          <CardTitle className="text-3xl">Pookie Contributor Leaderboard</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Ranking of the top contributors to the community.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
            <Suspense fallback={<ContributorListSkeleton />}>
                <PookieContributorsList />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
