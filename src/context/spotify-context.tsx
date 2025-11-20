
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WebPlaybackSDK, usePlayerDevice, usePlaybackState, useSpotifyPlayer } from 'react-spotify-web-playback-sdk';
import { useToast } from '@/hooks/use-toast';
import type { SpotifyTrack } from '@/lib/types';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '0d91aedbe93d49259da6d0c1f7cf4ebd';

type SpotifyContextType = {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
    player: Spotify.Player | null;
    device: Spotify.Device | null;
    playbackState: Spotify.PlaybackState | null;
    recentlyPlayed: SpotifyApi.PlayHistoryObject[];
    topTracks: SpotifyTrack[];
    searchResults: SpotifyTrack[];
    searchTracks: (query: string) => Promise<void>;
    isLoading: boolean;
    playTrack: (uri: string) => void;
};

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

const getRedirectUri = () => {
    if (typeof window === 'undefined') return '';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocalhost
      ? 'http://localhost:9002/spotify-player'
      : 'https://suggestionbox-khaki.vercel.app/spotify-player';
};

const generateRandomString = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
};

export const SpotifyProvider = ({ children }: { children: ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [recentlyPlayed, setRecentlyPlayed] = useState<SpotifyApi.PlayHistoryObject[]>([]);
    const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
    const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchApi = useCallback(async (endpoint: string, token: string) => {
        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Spotify API error: ${errorBody.error.message}`);
        }
        return response.json();
    }, []);


    const fetchRecentlyPlayed = useCallback(async (token: string) => {
        try {
            const data = await fetchApi('/me/player/recently-played?limit=20', token);
            setRecentlyPlayed(data.items);
        } catch (error) {
            console.error('Error fetching recently played:', error);
            toast({ variant: 'destructive', title: 'Spotify Error', description: 'Could not fetch recently played tracks.' });
        }
    }, [fetchApi, toast]);
    
    const fetchTopTracks = useCallback(async (token: string) => {
        try {
            const data = await fetchApi('/me/top/tracks?time_range=short_term&limit=20', token);
            setTopTracks(data.items);
        } catch (error) {
            console.error('Error fetching top tracks:', error);
            toast({ variant: 'destructive', title: 'Spotify Error', description: 'Could not fetch your top tracks.' });
        }
    }, [fetchApi, toast]);
    
    const searchTracks = async (query: string) => {
        if (!accessToken) return;
        try {
            const data = await fetchApi(`/search?q=${encodeURIComponent(query)}&type=track&limit=20`, accessToken);
            setSearchResults(data.tracks.items);
        } catch (error) {
            console.error('Error searching tracks:', error);
            toast({ variant: 'destructive', title: 'Spotify Error', description: 'Could not perform search.' });
        }
    }
    
    const getOAuthToken: (callback: (token: string) => void) => void = useCallback((callback) => {
        const storedToken = localStorage.getItem('spotify_access_token');
        if (storedToken) {
            callback(storedToken);
        }
    }, []);

    const login = async () => {
        setIsLoading(true);
        const codeVerifier = generateRandomString(64);
        window.localStorage.setItem('spotify_code_verifier', codeVerifier);

        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);
        
        const REDIRECT_URI = getRedirectUri();
        const scope = "streaming user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-recently-played user-top-read";

        const params = {
            response_type: 'code',
            client_id: CLIENT_ID,
            scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: REDIRECT_URI,
        };

        const authUrl = new URL("https://accounts.spotify.com/authorize");
        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    };

    const logout = () => {
        setAccessToken(null);
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        setRecentlyPlayed([]);
        setTopTracks([]);
        setSearchResults([]);
    };
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const storedToken = localStorage.getItem('spotify_access_token');

        if (storedToken) {
            setAccessToken(storedToken);
            return;
        }

        if (code) {
            const exchangeToken = async () => {
                setIsLoading(true);
                const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
                if (!codeVerifier) {
                    console.error('Code verifier not found.');
                    setIsLoading(false);
                    return;
                }
                
                const REDIRECT_URI = getRedirectUri();

                try {
                    const response = await fetch("https://accounts.spotify.com/api/token", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            client_id: CLIENT_ID,
                            grant_type: 'authorization_code',
                            code,
                            redirect_uri: REDIRECT_URI,
                            code_verifier: codeVerifier,
                        }),
                    });

                    if (!response.ok) throw new Error('Token exchange failed');

                    const data = await response.json();
                    localStorage.setItem('spotify_access_token', data.access_token);
                    localStorage.setItem('spotify_refresh_token', data.refresh_token);
                    setAccessToken(data.access_token);

                    window.history.pushState({}, '', window.location.pathname);
                } catch (error) {
                    console.error('Spotify token exchange error:', error);
                    toast({ variant: 'destructive', title: 'Spotify Auth Error', description: 'Failed to get authentication token.' });
                } finally {
                    setIsLoading(false);
                }
            };
            exchangeToken();
        }
    }, [toast]);
    
     useEffect(() => {
        if (accessToken) {
            setIsLoading(true);
            Promise.all([
                fetchRecentlyPlayed(accessToken),
                fetchTopTracks(accessToken)
            ]).finally(() => setIsLoading(false));
        }
    }, [accessToken, fetchRecentlyPlayed, fetchTopTracks]);
    
    const value = {
        isLoggedIn: !!accessToken,
        login,
        logout,
        recentlyPlayed,
        topTracks,
        searchResults,
        searchTracks,
        isLoading,
    };

    if (!CLIENT_ID) {
        return (
            <SpotifyContext.Provider value={{...value, player: null, device: null, playbackState: null, playTrack: () => {}}}>
                {children}
            </SpotifyContext.Provider>
        )
    }

    return (
        <WebPlaybackSDK
            deviceName="StudyShare Central Player"
            getOAuthToken={getOAuthToken}
            volume={0.5}
        >
            <SpotifyProviderCore accessToken={accessToken} value={value}>
                {children}
            </SpotifyProviderCore>
        </WebPlaybackSDK>
    )
};

const SpotifyProviderCore = ({ children, accessToken, value }: { children: ReactNode, accessToken: string | null, value: any }) => {
    const player = useSpotifyPlayer();
    const device = usePlayerDevice();
    const playbackState = usePlaybackState();

    const playTrack = useCallback((uri: string) => {
        if (player && device?.device_id) {
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device.device_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ uris: [uri] })
            });
        }
    }, [player, device?.device_id, accessToken]);

    return (
        <SpotifyContext.Provider value={{...value, player, device, playbackState, playTrack }}>
            {children}
        </SpotifyContext.Provider>
    );
};


export const useSpotify = () => {
    const context = useContext(SpotifyContext);
    if (context === undefined) {
        throw new Error('useSpotify must be used within a SpotifyProvider');
    }
    return context;
};
