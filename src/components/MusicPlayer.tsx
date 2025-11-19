'use client';

import { useRef, useEffect } from 'react';
import { useMusic } from '@/context/MusicContext';

export function MusicPlayer() {
  const { isPlaying, fadeAudio } = useMusic();
  const audioRef = useRef<HTMLAudioElement>(null);
  const isAudioReady = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Set the audio element in the context
    if (typeof fadeAudio === 'function') {
        // This is a bit of a hack to pass the audio ref to the context
        (fadeAudio as any).audio = audio;
    }

    const handleCanPlay = () => {
        isAudioReady.current = true;
        if (isPlaying) {
            fadeAudio(0.2);
        }
    };

    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.load();

    return () => {
        audio.removeEventListener('canplaythrough', handleCanPlay);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <audio
      ref={audioRef}
      src="https://ryvsxwjnldugnwxjhgem.supabase.co/storage/v1/object/public/uploads/Arcade%20game%20music%20loop%20%20free%20sound%20effects.mp3"
      loop
      preload="auto"
    />
  );
}
