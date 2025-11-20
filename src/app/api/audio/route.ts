
import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { PassThrough } from 'stream';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId || !ytdl.validateID(videoId)) {
    return new NextResponse('Invalid or missing YouTube video ID', { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(videoId);
    const audioFormat = ytdl.chooseFormat(info.formats, { 
        quality: 'highestaudio',
        filter: 'audioonly' 
    });

    if (!audioFormat) {
      return new NextResponse('No audio-only format found for this video.', { status: 404 });
    }

    // We will stream the content. Let's set up the PassThrough stream.
    const stream = new PassThrough();
    
    // Use ytdl-core to get the audio stream and pipe it to our PassThrough stream
    ytdl.downloadFromInfo(info, { format: audioFormat }).pipe(stream);

    // Set appropriate headers for streaming audio
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    
    // Since Next.js 13.4, you can return a ReadableStream directly.
    return new NextResponse(stream as any, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error(`Error fetching audio for video ID ${videoId}:`, error);
    return new NextResponse(`An error occurred: ${error.message}`, { status: 500 });
  }
}
