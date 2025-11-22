
import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function GET(request: Request) {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
        console.error("ImageKit environment variables are not configured on the server.");
        return NextResponse.json({ 
            error: 'Server-side configuration error. The ImageKit private key or other credentials are not set.' 
        }, { status: 500 });
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
        console.error("ImageKit Auth Generation Error:", error);
        return NextResponse.json({ error: 'Failed to generate ImageKit authentication parameters.' }, { status: 500 });
    }
}
