import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function GET(request: Request) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
        return NextResponse.json({ error: 'ImageKit environment variables are not configured.' }, { status: 500 });
    }

    const imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
    });
    
    try {
        const authenticationParameters = imagekit.getAuthenticationParameters();
        return NextResponse.json(authenticationParameters);
    } catch (error) {
        console.error("ImageKit Auth Error:", error);
        return NextResponse.json({ error: 'Failed to get ImageKit authentication parameters.' }, { status: 500 });
    }
}
