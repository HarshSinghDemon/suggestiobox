import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function GET(request: Request) {
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    console.error('ImageKit environment variables are not configured.');
    return NextResponse.json(
      { message: 'Server configuration error for ImageKit.' },
      { status: 500 }
    );
  }

  try {
    const imagekit = new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
    
    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    return NextResponse.json({
        ...authenticationParameters,
        url: IMAGEKIT_URL_ENDPOINT,
        publicKey: IMAGEKIT_PUBLIC_KEY,
    });
  } catch (error) {
    console.error('Error getting ImageKit authentication parameters:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Error generating ImageKit token', error: errorMessage },
      { status: 500 }
    );
  }
}
