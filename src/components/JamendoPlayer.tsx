'use client';

import React, { useState, useEffect } from 'react';

// Style objects for a clean UI without external CSS
const styles = {
  playerContainer: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '400px',
    width: '100%',
    margin: 'auto',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    background: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
    border: '1px solid hsl(var(--border))',
    textAlign: 'center',
  },
  coverArt: {
    width: '100%',
    height: 'auto',
    aspectRatio: '1 / 1',
    borderRadius: '12px',
    objectFit: 'cover',
    marginBottom: '1.5rem',
    border: '1px solid hsl(var(--border))',
  },
  trackInfo: {
    marginBottom: '1.5rem',
  },
  trackName: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: '0',
    lineHeight: '1.2',
  },
  artistName: {
    fontSize: '1rem',
    color: 'hsl(var(--muted-foreground))',
    margin: '0.25rem 0 0 0',
  },
  iframePlayer: {
    width: '100%',
    height: '60px',
    border: 'none',
    borderRadius: '8px',
  },
  loader: {
    textAlign: 'center',
    fontSize: '1rem',
    color: 'hsl(var(--muted-foreground))',
    padding: '2rem',
  },
  error: {
    color: 'hsl(var(--destructive))',
    padding: '2rem',
    textAlign: 'center',
    background: 'hsl(var(--destructive) / 0.1)',
    borderRadius: '8px',
  }
};

/**
 * A React component to display and play a Mixcloud show.
 * It fetches metadata from the Mixcloud API and embeds their widget.
 */
export function JamendoPlayer() {
  const [showData, setShowData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default Mixcloud show to feature
  const mixcloudUsername = 'LofiGirl';
  const mixcloudShowName = 'lofi-girl-phonk-1';
  
  useEffect(() => {
    const fetchShowData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://api.mixcloud.com/${mixcloudUsername}/${mixcloudShowName}/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        setShowData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowData();
  }, [mixcloudUsername, mixcloudShowName]);

  if (isLoading) {
    return <div style={styles.loader}>Loading Mixcloud player...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }
  
  if (!showData) {
      return <div style={styles.loader}>No show data found.</div>
  }

  // Construct the URL for the Mixcloud embed widget
  const feedUrl = encodeURIComponent(`/${mixcloudUsername}/${mixcloudShowName}/`);
  const iframeSrc = `https://www.mixcloud.com/widget/iframe/?feed=${feedUrl}&hide_cover=1&mini=1`;
  
  return (
    <div style={styles.playerContainer}>
      <img
        src={showData.pictures?.extra_large}
        alt={`Cover for ${showData.name}`}
        style={styles.coverArt}
      />

      <div style={styles.trackInfo}>
        <h2 style={styles.trackName}>{showData.name}</h2>
        <p style={styles.artistName}>by {showData.user?.name}</p>
      </div>

      <iframe
        title="Mixcloud Embed"
        src={iframeSrc}
        style={styles.iframePlayer}
      ></iframe>
    </div>
  );
}
