import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function POST(request: Request) {
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    console.error('ImageKit environment variables are not configured for deletion.');
    return NextResponse.json(
      { message: 'Server configuration error for ImageKit.' },
      { status: 500 }
    );
  }

  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ message: 'File ID is required.' }, { status: 400 });
    }

    const imagekit = new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });

    await imagekit.deleteFile(fileId);

    return NextResponse.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Error deleting file from ImageKit:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Error deleting file from ImageKit', error: errorMessage },
      { status: 500 }
    );
  }
}
