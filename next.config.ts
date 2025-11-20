
require('dotenv').config();
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'ryvsxwjnldugnwxjhgem.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.jamendo.com',
      },
      {
        protocol: 'https',
        hostname: 'usercontent.jamendo.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      maxDuration: 120, // 2 minutes
    },
  },
  env: {
    NEXT_PUBLIC_YOUTUBE_API_KEY: 'AIzaSyAX3DyUUOCOE2j3UpRNnP0VMUSjf0s6MFs',
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    NEXT_PUBLIC_JAMENDO_CLIENT_ID: '3d159494',
  },
};

export default nextConfig;
