'use client';

import { useMusic } from '@/context/music-context';
import React, { useEffect, useRef } from 'react';

export function SiteWidePlayer() {
  const { setAudioElement, playNext } = useMusic();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Expose the audio element to the context
  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
  }, [setAudioElement]);

  return <audio ref={audioRef} onEnded={playNext} crossOrigin="anonymous" />;
}
