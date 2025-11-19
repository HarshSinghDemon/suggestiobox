import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

const SuggestionForm = dynamic(() => import('@/components/uploads/suggestion-form').then(mod => mod.SuggestionForm), {
  loading: () => <Skeleton className="w-full h-[400px]" />,
});

export default function NewSuggestionPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
        <div className="container py-8 mx-auto">
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-2xl font-bold">Configuration Error</h1>
                <p className="mt-4 text-muted-foreground">
                    Supabase URL or Anonymous Key is not configured in your environment variables. 
                    Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.
                </p>
            </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center p-1 rounded-lg bg-muted">
              <Button variant="ghost" className="bg-background text-foreground" asChild>
                <Link href="/suggestions/new">Suggestion</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/assignments/new">Assignment</Link>
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Submit a New Suggestion</CardTitle>
              <CardDescription>
                Share your ideas, notes, or helpful resources with the community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
                <SuggestionForm supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthWrapper>
  );
}
