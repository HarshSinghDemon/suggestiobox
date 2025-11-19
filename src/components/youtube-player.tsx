'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

type YouTubePlayerProps = {
  videoId: string;
  onStateChange?: (event: { data: number }) => void;
};

export type YouTubePlayerRef = {
  playVideo: () => void;
  pauseVideo: () => void;
};

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({ videoId, onStateChange }, ref) => {
  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createPlayer = () => {
      if (playerRef.current || !playerDivRef.current) return;
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: videoId, // Required for loop to work
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(20);
          },
          onStateChange: onStateChange,
        },
      });
    };

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
      
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

    } else {
      createPlayer();
    }
    
    return () => {
        if(playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
            playerRef.current = null;
        }
    }
  }, [videoId, onStateChange]);

  useImperativeHandle(ref, () => ({
    playVideo: () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    },
    pauseVideo: () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    },
  }));

  return <div ref={playerDivRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />;
});

YouTubePlayer.displayName = 'YouTubePlayer';
