'use server';

import {NextRequest, NextResponse} from 'next/server';
import ytdl from 'ytdl-core';

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId || !ytdl.validateID(videoId)) {
    return new NextResponse('Invalid or missing YouTube video ID', {
      status: 400,
    });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    if (!audioFormat) {
      return new NextResponse('No suitable audio format found.', {status: 404});
    }

    const responseHeaders = new Headers({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    });

    // Directly stream the content from ytdl
    const stream = ytdl(videoUrl, {
      format: audioFormat,
    });

    // For environments that support ReadableStream directly in NextResponse
    return new NextResponse(stream as any, {
      headers: responseHeaders,
      status: 200,
    });
  } catch (error: any) {
    console.error(`Error fetching audio stream for ID ${videoId}:`, error);
    return new NextResponse(
      `Server error: ${error.message || 'Could not fetch audio stream.'}`,
      {status: 500}
    );
  }
}
