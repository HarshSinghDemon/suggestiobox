'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Style objects for modern UI without external CSS libraries
const styles = {
  playerContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '450px',
    margin: 'auto',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    background: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
    border: '1px solid hsl(var(--border))',
  },
  albumArt: {
    width: '100%',
    height: 'auto',
    aspectRatio: '1 / 1',
    borderRadius: '8px',
    objectFit: 'cover',
    marginBottom: '1rem',
  },
  trackInfo: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  trackName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0',
  },
  artistName: {
    fontSize: '1rem',
    color: 'hsl(var(--muted-foreground))',
    margin: '0.25rem 0 0 0',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    margin: '1.5rem 0',
  },
  controlButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'hsl(var(--foreground))',
  },
  playButton: {
    background: 'hsl(var(--primary))',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    color: 'hsl(var(--primary-foreground))',
    boxShadow: '0 4px 15px hsla(var(--primary), 0.4)',
  },
  audioPlayer: {
    width: '100%',
  },
  loader: {
    textAlign: 'center',
    fontSize: '1rem',
    color: 'hsl(var(--muted-foreground))',
  }
};

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const NextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
);
const PrevIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
);


export function JamendoPlayer() {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);

  const JAMENDO_CLIENT_ID = '3d159494';
  const JAMENDO_API_URL = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=30&audioformat=mp31&include=musicinfo`;

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(JAMENDO_API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Filter for tracks that have a valid MP3 audio URL
        const playableTracks = data.results.filter(
          (track) => track.audio && track.audio.includes(".mp3")
        );

        if (playableTracks.length === 0) {
          throw new Error("No playable tracks found from the API.");
        }

        setPlaylist(playableTracks);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // This promise-based play is important for handling autoplay policies
        audioRef.current.play().catch(e => {
            console.error("Playback was prevented.", e)
            setIsPlaying(false); // Update state if play() is rejected
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const playNext = useCallback(() => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  }, [playlist.length]);

  const playPrevious = useCallback(() => {
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  // Effect to handle changing track source and autoplay
  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      const currentTrack = playlist[currentTrackIndex];
      audioRef.current.src = currentTrack.audio;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Autoplay failed on track change.", e));
      }
    }
  }, [currentTrackIndex, playlist, isPlaying]);

  if (isLoading) {
    return <div style={styles.loader}>Loading music...</div>;
  }

  if (error) {
    return <div style={{...styles.loader, color: 'red'}}>Error: {error}</div>;
  }
  
  if (playlist.length === 0) {
      return <div style={styles.loader}>No songs to display.</div>;
  }

  const currentTrack = playlist[currentTrackIndex];

  return (
    <div style={styles.playerContainer}>
      <img
        src={currentTrack.album_image}
        alt={`Album art for ${currentTrack.name}`}
        style={styles.albumArt}
      />

      <div style={styles.trackInfo}>
        <h2 style={styles.trackName}>{currentTrack.name}</h2>
        <p style={styles.artistName}>{currentTrack.artist_name}</p>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.audio}
        onEnded={playNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls
        style={styles.audioPlayer}
      />

      <div style={styles.controls}>
        <button onClick={playPrevious} style={styles.controlButton} aria-label="Previous song">
          <PrevIcon />
        </button>
        <button onClick={handlePlayPause} style={styles.playButton} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={playNext} style={styles.controlButton} aria-label="Next song">
          <NextIcon />
        </button>
      </div>
    </div>
  );
}
