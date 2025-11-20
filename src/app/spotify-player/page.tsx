
'use client';

import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Music, AlertCircle } from "lucide-react";
import { useCallback } from "react";
import { WebPlaybackSDK } from 'react-spotify-web-playback-sdk';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/spotify-player` : '';
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
    const { user } = useAuth();
    
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
                <Card className="max-w-xl mx-auto">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Music className="w-16 h-16 text-green-500" />
                        </div>
                        <CardTitle className="text-3xl">Spotify Web Player</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground">
                            Connect your Spotify account to listen to music directly on this site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WebPlaybackSDK
                            deviceName="My Study App Player"
                            getOAuthToken={getOAuthToken}
                            volume={0.5}
                        >
                          <PlayerUI />
                        </WebPlaybackSDK>
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper>
    );
}

const PlayerUI = () => {
  // A simple UI that will be rendered by the SDK when ready
  return (
    <div className="p-4 border rounded-lg bg-muted">
        <p className="text-center text-muted-foreground">
            Player is ready. Control playback from your Spotify app or other devices.
        </p>
    </div>
  );
};
