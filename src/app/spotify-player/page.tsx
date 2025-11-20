
'use client';

import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, AlertCircle, Play, Pause, SkipBack, SkipForward, Loader2, Volume2, Volume1, VolumeX } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { WebPlaybackSDK, useSpotifyPlayer, usePlaybackState, usePlayerDevice } from 'react-spotify-web-playback-sdk';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '0d91aedbe93d49259da6d0c1f7cf4ebd';
const REDIRECT_URI = 'https://suggestionbox-khaki.vercel.app/spotify-player';
const SCOPES = "streaming user-read-private user-read-email user-read-playback-state user-modify-playback-state";

// Helper to generate a random string for the code verifier
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Helper to hash the code verifier
const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

// Helper to base64 encode the hash
const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};


export default function SpotifyPlayerPage() {
    // This function will handle redirecting the user to Spotify for authentication
    const handleLogin = async () => {
        const codeVerifier = generateRandomString(64);
        window.localStorage.setItem('spotify_code_verifier', codeVerifier);

        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);

        const params = {
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SCOPES,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: REDIRECT_URI,
        };

        const authUrl = new URL("https://accounts.spotify.com/authorize");
        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    };
    
    // This callback function will be used by the SDK to get the access token
    const getOAuthToken: (callback: (token: string) => void) => void = useCallback(
        async (callback) => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            if (code) {
                // We have a code, let's exchange it for a token
                const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
                if (!codeVerifier) {
                    console.error('Code verifier not found in local storage.');
                    handleLogin(); // Restart auth flow
                    return;
                }

                const payload = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: CLIENT_ID,
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: REDIRECT_URI,
                        code_verifier: codeVerifier,
                    }),
                };
                
                try {
                    const response = await fetch("https://accounts.spotify.com/api/token", payload);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch token: ${response.statusText}`);
                    }
                    const data = await response.json();
                    
                    // Store tokens and remove code from URL
                    window.localStorage.setItem('spotify_access_token', data.access_token);
                    window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
                    window.history.pushState({}, '', REDIRECT_URI); // Clean URL
                    
                    callback(data.access_token);
                } catch(error) {
                    console.error("Token exchange error:", error);
                    handleLogin(); // Restart auth flow on error
                }
            } else {
                // No code, maybe we have a stored token?
                const storedToken = window.localStorage.getItem('spotify_access_token');
                if (storedToken) {
                    callback(storedToken);
                } else {
                    // No code and no token, we need to login
                    handleLogin();
                }
            }
        },
        []
    );

    if (!CLIENT_ID) {
      return (
        <AuthWrapper>
          <div className="container py-12 mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                The Spotify Client ID is not configured. Please set the 
                <code className="mx-1 font-mono">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code>
                in your <code className="mx-1 font-mono">.env</code> file. You also need to configure the Redirect URI in your
                Spotify Developer Dashboard to <code className="mx-1 font-mono">{REDIRECT_URI}</code>.
              </AlertDescription>
            </Alert>
          </div>
        </AuthWrapper>
      )
    }

    return (
        <AuthWrapper>
            <div className="container py-12 mx-auto">
                <WebPlaybackSDK
                    deviceName="StudyShare Central Player"
                    getOAuthToken={getOAuthToken}
                    volume={0.5}
                >
                    <PlayerUI />
                </WebPlaybackSDK>
            </div>
        </AuthWrapper>
    );
}

const PlayerUI = () => {
  const player = useSpotifyPlayer();
  const playbackState = usePlaybackState();
  const device = usePlayerDevice();

  const [volume, setVolume] = useState(0.5);
  const [trackUri, setTrackUri] = useState('');

  useEffect(() => {
    if (player) {
      player.getVolume().then(v => setVolume(v * 100));
    }
  }, [player]);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (player) {
      player.setVolume(newVolume / 100);
      setVolume(newVolume);
    }
  };
  
  const handlePlayUri = () => {
      if(player && device?.device_id && trackUri) {
          fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device.device_id}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${window.localStorage.getItem('spotify_access_token')}`
              },
              body: JSON.stringify({ uris: [trackUri] })
          });
      }
  }

  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-5 h-5"/>;
    if (volume < 50) return <Volume1 className="w-5 h-5"/>;
    return <Volume2 className="w-5 h-5"/>
  }
  
  if (!player) {
    return (
        <Card className="max-w-md mx-auto text-center">
            <CardHeader>
                <CardTitle>Connecting to Spotify...</CardTitle>
                <CardDescription>Please wait while we set up the player.</CardDescription>
            </CardHeader>
            <CardContent>
                <Loader2 className="w-10 h-10 mx-auto animate-spin" />
            </CardContent>
        </Card>
    );
  }

  const currentTrack = playbackState?.track_window?.current_track;
  const isPaused = playbackState?.paused ?? true;
  const albumArtUrl = currentTrack?.album.images[0]?.url;

  return (
    <Card className="max-w-md mx-auto overflow-hidden">
        <CardHeader className="p-0">
            <div className="relative aspect-square">
            {albumArtUrl ? (
                <Image
                    src={albumArtUrl}
                    alt={currentTrack?.album.name || 'Album Art'}
                    fill
                    className="object-cover"
                />
            ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                    <Music className="w-24 h-24 text-muted-foreground" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
        </CardHeader>
        <CardContent className="relative p-6 space-y-6 text-center -mt-14">
            <div>
                <h2 className="text-xl font-bold truncate text-foreground">
                    {currentTrack?.name || 'No song selected'}
                </h2>
                <p className="text-muted-foreground">
                    {currentTrack?.artists.map(a => a.name).join(', ') || 'Select a song on your Spotify app'}
                </p>
            </div>


            <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => player.previousTrack()}>
                    <SkipBack className="w-6 h-6" />
                </Button>
                <Button size="lg" className="w-16 h-16 rounded-full" onClick={() => player.togglePlay()}>
                    {isPaused ? <Play className="w-8 h-8 ml-1 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => player.nextTrack()}>
                    <SkipForward className="w-6 h-6" />
                </Button>
            </div>
            
            <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <VolumeIcon />
                    <Slider 
                        id="volume"
                        defaultValue={[volume]} 
                        max={100} 
                        step={1} 
                        onValueChange={handleVolumeChange}
                    />
                </div>
                 <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input 
                        type="text" 
                        placeholder="spotify:track:URI" 
                        value={trackUri}
                        onChange={(e) => setTrackUri(e.target.value)}
                    />
                    <Button type="button" onClick={handlePlayUri} disabled={!trackUri}>Play URI</Button>
                </div>
            </div>
        </CardContent>
    </Card>
  );
};
