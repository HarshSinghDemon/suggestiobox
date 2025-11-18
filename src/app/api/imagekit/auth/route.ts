import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function GET(request: Request) {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json({
        ...authenticationParameters,
        url: process.env.IMAGEKIT_URL_ENDPOINT!,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
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
