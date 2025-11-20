
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
    <div className="container py-8 mx-auto md:py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="relative flex justify-center mb-4">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-yellow-500 to-primary opacity-75 blur-sm transition duration-500 group-hover:opacity-100 group-hover:duration-200 animate-tilt"></div>
            <div className="relative inline-block p-1 bg-background rounded-full">
                <Avatar className="w-24 h-24 md:w-28 md:h-28">
                    <AvatarImage src="https://avatars.githubusercontent.com/u/108394287?v=4" alt="Harsh Singh" />
                    <AvatarFallback>HS</AvatarFallback>
                </Avatar>
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">Harsh Singh</CardTitle>
          <CardDescription className="text-base md:text-lg text-muted-foreground">
            Site Administrator & Creator
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-6">
          <p className="text-center text-foreground/80">
            Harsh is the passionate developer behind this platform, dedicated to building helpful tools for the community. He is committed to ensuring a safe, valuable, and seamless experience for all users.
          </p>
          <div className="pt-4 space-y-4 border-t">
            <h3 className="text-lg font-semibold text-center md:text-xl">Contact Information</h3>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <a href="mailto:harshroop100@gmail.com" className="text-sm font-medium md:text-base hover:underline">
                harshroop100@gmail.com
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <Phone className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <a href="tel:8210294946" className="text-sm font-medium md:text-base hover:underline">
                8210294946
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <InstagramIcon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <a 
                href="https://www.instagram.com/specifichxrsh" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm font-medium md:text-base hover:underline"
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
