import { ConnectFour } from '@/components/game/connect-four';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function ConnectFourPage() {
  return (
    <div className="container py-12 mx-auto">
      <Card className="mx-auto w-fit">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Bot className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Connect Four</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Can you beat the AI?
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <ConnectFour />
        </CardContent>
      </Card>
    </div>
  );
}
