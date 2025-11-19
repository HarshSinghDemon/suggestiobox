'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Configuration ---
const JAMENDO_CLIENT_ID = '3d159494';
const FREESOUND_API_KEY = 'obpKcmnE6dyzv0C58Zm18zMCa0bRpwXlTd2qFGLQ';

const API_ENDPOINTS = {
  jamendo: `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=50&audioformat=mp31&include=musicinfo`,
  freesound: `https://freesound.org/apiv2/search/text/?query=music+loop&fields=id,name,previews,images&token=${FREESOUND_API_KEY}`,
};

const SOUNDHELIX_SONGS = [
  { name: 'SoundHelix Song 1', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', image: null, source: 'SoundHelix' },
  { name: 'SoundHelix Song 2', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', image: null, source: 'SoundHelix' },
  { name: 'SoundHelix Song 3', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', image: null, source: 'SoundHelix' },
];

// --- Style Objects (No external CSS) ---
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    width: '100%',
    maxWidth: '450px',
    margin: 'auto',
    padding: '2rem',
    borderRadius: '16px',
    background: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  coverArtContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%', // 1:1 Aspect Ratio
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'hsl(var(--muted))',
  },
  coverArt: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40%',
    height: '40%',
    color: 'hsl(var(--muted-foreground))',
  },
  trackInfo: {
    textAlign: 'center',
  },
  trackName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: '0',
    lineHeight: '1.2',
    color: 'hsl(var(--foreground))',
  },
  artistName: {
    fontSize: '1rem',
    margin: '0.25rem 0 0 0',
    color: 'hsl(var(--muted-foreground))',
  },
  sourceBadge: {
    display: 'inline-block',
    marginTop: '0.75rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    background: 'hsl(var(--primary) / 0.1)',
    color: 'hsl(var(--primary))',
  },
  audioPlayer: {
    width: '100%',
  },
  statusMessage: {
    padding: '3rem 1rem',
    textAlign: 'center',
    color: 'hsl(var(--muted-foreground))',
  }
};

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export function RandomMusicPlayer() {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [status, setStatus] = useState('loading'); // loading, ready, error
  const audioRef = useRef(null);

  const fetchAllMusic = useCallback(async () => {
    setStatus('loading');
    try {
      // Fetch from all sources in parallel
      const [jamendoResponse, freesoundResponse] = await Promise.all([
        fetch(API_ENDPOINTS.jamendo),
        fetch(API_ENDPOINTS.freesound),
      ]);

      if (!jamendoResponse.ok || !freesoundResponse.ok) {
        throw new Error('Failed to fetch data from one or more APIs.');
      }

      const jamendoData = await jamendoResponse.json();
      const freesoundData = await freesoundResponse.json();

      // --- Process and Filter Data ---
      const jamendoTracks = jamendoData.results
        .filter(t => t.audio && t.audio.includes('.mp3'))
        .map(t => ({
          name: t.name || 'Untitled',
          artist: t.artist_name || 'Unknown Artist',
          url: t.audio,
          image: t.image || null,
          source: 'Jamendo',
        }));

      const freesoundTracks = freesoundData.results
        .filter(t => t.previews && t.previews['preview-hq-mp3'])
        .map(t => ({
          name: t.name || 'Untitled Sound',
          artist: 'Freesound',
          url: t.previews['preview-hq-mp3'],
          image: t.images ? t.images.waveform_m : null,
          source: 'Freesound',
        }));

      // Combine and shuffle all tracks
      const combined = [...jamendoTracks, ...freesoundTracks, ...SOUNDHELIX_SONGS];
      const shuffled = shuffleArray(combined);

      if (shuffled.length === 0) {
        throw new Error('No playable music could be found from any source.');
      }

      setPlaylist(shuffled);
      setCurrentTrackIndex(0);
      setStatus('ready');

    } catch (error) {
      console.error("Music Fetch Error:", error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchAllMusic();
  }, [fetchAllMusic]);
  
  const handleNextTrack = useCallback(() => {
    setCurrentTrackIndex(prevIndex => (prevIndex + 1) % playlist.length);
  }, [playlist.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && status === 'ready' && playlist.length > 0) {
      const track = playlist[currentTrackIndex];
      if (audio.src !== track.url) {
        audio.src = track.url;
      }
      audio.play().catch(e => console.error("Autoplay was prevented:", e));
    }
  }, [currentTrackIndex, playlist, status]);

  if (status === 'loading') {
    return <div style={styles.statusMessage}>Loading tunes from across the internet...</div>;
  }

  if (status === 'error') {
    return <div style={styles.statusMessage}>Could not fetch music. Please try refreshing the page.</div>;
  }

  const currentTrack = playlist[currentTrackIndex];
  if (!currentTrack) {
    return <div style={styles.statusMessage}>No tracks available.</div>;
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.coverArtContainer}>
        {currentTrack.image ? (
          <img
            src={currentTrack.image}
            alt={`Cover for ${currentTrack.name}`}
            style={styles.coverArt}
          />
        ) : (
          <svg style={styles.placeholderIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        )}
      </div>

      <div style={styles.trackInfo}>
        <h2 style={styles.trackName}>{currentTrack.name}</h2>
        <p style={styles.artistName}>{currentTrack.artist}</p>
        <div style={styles.sourceBadge}>{currentTrack.source}</div>
      </div>

      <audio
        ref={audioRef}
        controls
        src={currentTrack.url}
        onEnded={handleNextTrack}
        style={styles.audioPlayer}
        key={currentTrack.url} // Force re-render on track change
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
