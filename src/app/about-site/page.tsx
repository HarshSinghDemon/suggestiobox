
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, Users, UploadCloud, MessageSquare, Gamepad2, BrainCircuit, Code2, Music } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ElementType, title: string, description: string }) => {
    const Icon = icon;
    return (
        <div className="flex flex-col items-center gap-2 p-4 text-center border rounded-lg bg-card/50">
            <Icon className="w-10 h-10 mb-2 text-primary" />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

export default function AboutSitePage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">About The Suggestion Box</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            More Than a Platform—It's a Community Hub
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-8 text-center">
          <p className="text-lg">
            Welcome to the ultimate student hub, built by and for the students of the Computer Science department. What started as a simple space for sharing notes has evolved into a feature-rich platform designed for collaboration, learning, and fun. Our goal is to foster an open and connected community where knowledge is accessible, friendships are made, and you have the tools to succeed and unwind.
          </p>
          
          <div className="grid grid-cols-1 gap-6 pt-8 mt-8 border-t md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
                icon={UploadCloud}
                title="Share Knowledge"
                description="Upload and browse helpful suggestions, notes, and lab assignments shared by the community."
            />
            <FeatureCard 
                icon={Users}
                title="Community Driven"
                description="Connect with peers, see who's online, and build your network in our members section."
            />
             <FeatureCard 
                icon={MessageSquare}
                title="Secure Chat"
                description="Connect with friends through private, end-to-end encrypted chats and create group discussions."
            />
            <FeatureCard 
                icon={BrainCircuit}
                title="AI Assistants"
                description="Leverage AI with our Study Buddy for content analysis, Code Buddy for programming help, and Pookie, your personal AI friend."
            />
            <FeatureCard 
                icon={Code2}
                title="Developer Sandbox"
                description="Write, compile, and run code in multiple languages directly in our online code editor."
            />
            <FeatureCard 
                icon={Gamepad2}
                title="Arcade & Games"
                description="Take a break and challenge your friends or the high scores in the community games arcade."
            />
            <FeatureCard 
                icon={Music}
                title="Jokebox Player"
                description="Listen to your favorite music with an audio-only YouTube player, without video distractions."
            />
            <FeatureCard 
                icon={BookCopy}
                title="Browse & Discover"
                description="Easily filter and find academic content by semester and subject to get the help you need."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
