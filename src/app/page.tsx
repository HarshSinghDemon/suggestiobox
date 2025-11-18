import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { BrowseSection } from '@/components/browse/browse-section';
import placeholderImages from '@/lib/placeholder-images.json';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type HomeProps = {
  searchParams: {
    tab?: 'suggestions' | 'assignments';
    subject?: string;
  };
};

export default function Home({ searchParams }: HomeProps) {
  const { tab = 'suggestions', subject } = searchParams;
  const heroImage = placeholderImages.placeholderImages.find(
    (img) => img.id === 'hero'
  );

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <section className="relative w-full h-[40vh] md:h-[50vh] flex items-center justify-center text-center">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover brightness-50"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="relative z-10 p-4 space-y-4 text-white">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl font-headline">
            Welcome to StudyShare Central
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-200">
            Your hub for academic collaboration. Share, discover, and download
            study materials.
          </p>
          <div className="flex justify-center gap-4">
             <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/?tab=suggestions#browse">Browse Suggestions</Link>
             </Button>
             <Button asChild size="lg" variant="secondary" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Link href="/?tab=assignments#browse">Browse Assignments</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="browse" className="container px-4 mx-auto md:px-6">
        <BrowseSection activeTab={tab} activeSubject={subject} />
      </section>
    </div>
  );
}
