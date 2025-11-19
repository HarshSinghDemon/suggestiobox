import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

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


export default function AboutAdminPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="relative flex justify-center mb-4">
              <div className="relative w-28 h-28 p-1 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-600 animate-spin-slow">
                <div className="w-full h-full p-1 bg-background rounded-full">
                    <Avatar className="w-full h-full">
                        <AvatarImage src="https://github.com/shadcn.png" alt="Harsh Singh" />
                        <AvatarFallback>HS</AvatarFallback>
                    </Avatar>
                </div>
              </div>
          </div>
          <CardTitle className="text-3xl">Harsh Singh</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Site Administrator & Creator
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-6">
          <p className="text-center text-foreground/80">
            Harsh is the passionate developer behind this platform, dedicated to building helpful tools for the community. He is committed to ensuring a safe, valuable, and seamless experience for all users.
          </p>
          <div className="pt-4 space-y-4 border-t">
            <h3 className="text-xl font-semibold text-center">Contact Information</h3>
            <div className="flex items-center justify-center gap-4">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <a href="mailto:harshroop100@gmail.com" className="font-medium hover:underline">
                harshroop100@gmail.com
              </a>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <a href="tel:8210294946" className="font-medium hover:underline">
                8210294946
              </a>
            </div>
            <div className="flex items-center justify-center gap-4">
              <InstagramIcon className="w-5 h-5 text-muted-foreground" />
              <a 
                href="https://www.instagram.com/specifichxrsh" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium hover:underline"
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
