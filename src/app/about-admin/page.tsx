import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone } from 'lucide-react';

export default function AboutAdminPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-primary">
              <AvatarImage src="https://github.com/shadcn.png" alt="Harsh Singh" />
              <AvatarFallback>HS</AvatarFallback>
            </Avatar>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
