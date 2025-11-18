import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 bg-background text-foreground">
      <div className="relative w-full max-w-4xl mx-auto">
        <div
          className="absolute inset-0 bg-no-repeat bg-center"
          style={{
            backgroundImage: "url('/wavy-background.svg')",
            backgroundSize: '120% 120%',
          }}
        ></div>
        <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter">
            The
            <br />
            Suggestion
            <br />
            Box
          </h1>
          <div className="max-w-md space-y-4">
            <p className="text-lg">
              Got full lab assignments, a helpful study tip, or a suggestion for a class? Share it here!
            </p>
            <p className="text-lg">
              You can also upload helpful files for the community. Made with love by SectionB #ProudtobesectionB
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/suggestions/new">
                    Give a Suggestion
                    <ChevronRight className="w-6 h-6 ml-2" />
                </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8 py-6 text-lg">
                <Link href="/browse">
                    Explore Suggestions
                    <ChevronRight className="w-6 h-6 ml-2" />
                </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
