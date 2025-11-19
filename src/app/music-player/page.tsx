import { RandomMusicPlayer } from '@/components/RandomMusicPlayer';

export default function MusicPlayerPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
        <RandomMusicPlayer />
    </div>
  );
}
