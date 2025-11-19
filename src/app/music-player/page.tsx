import { JamendoPlayer } from '@/components/JamendoPlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MusicPlayerPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
        <JamendoPlayer />
    </div>
  );
}
