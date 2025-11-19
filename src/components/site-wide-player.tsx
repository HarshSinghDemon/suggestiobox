'use client';

import { useMusic } from '@/context/music-context';
import React, { useEffect, useRef } from 'react';

export function SiteWidePlayer() {
  const { currentSong, setAudioElement, playNext, isPlaying, volume } = useMusic();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Expose the audio element to the context
  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
  }, [setAudioElement]);

  // Effect to handle song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = currentSong.url;
      if (isPlaying) {
        audio.play().catch(() => { /* Autoplay was prevented */ });
      }
    }
  }, [currentSong, isPlaying]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume])

  return <audio ref={audioRef} onEnded={playNext} loop={false} />;
}
