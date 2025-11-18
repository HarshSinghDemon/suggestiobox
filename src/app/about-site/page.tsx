import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, Users, UploadCloud } from 'lucide-react';

export default function AboutSitePage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">About The Suggestion Box</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            A Collaborative Platform for Students
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-6 text-center">
          <p className="text-lg">
            This site is a dedicated space for sharing notes, suggestions, and lab assignments. It was made by and for the students in the Department of Computer Science, with a focus on Data Science and Cybersecurity.
          </p>
          <p className="text-muted-foreground">
            Our goal is to foster an open and collaborative community where knowledge is accessible to everyone.
          </p>
          <div className="grid grid-cols-1 gap-6 pt-6 mt-6 border-t md:grid-cols-3">
            <div className="flex flex-col items-center gap-2">
              <BookCopy className="w-10 h-10 text-primary" />
              <h3 className="font-semibold">Browse Content</h3>
              <p className="text-sm text-muted-foreground">Easily filter and find suggestions and assignments by subject.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="w-10 h-10 text-primary" />
              <h3 className="font-semibold">Share Knowledge</h3>
              <p className="text-sm text-muted-foreground">Upload your notes, helpful tips, or lab files to help others.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="w-10 h-10 text-primary" />
              <h3 className="font-semibold">Community Driven</h3>
              <p className="text-sm text-muted-foreground">An open-for-all platform where everyone can contribute and benefit.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
