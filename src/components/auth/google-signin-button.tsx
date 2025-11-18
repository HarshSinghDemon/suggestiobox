'use client';

import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';

function GoogleIcon() {
    return (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
        <title>Google icon</title>
        <path
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.06 1.67-3.41 0-6.18-2.8-6.18-6.18s2.77-6.18 6.18-6.18c1.93 0 3.25.78 4.18 1.67l2.52-2.52C18.15 2.09 15.63 1 12.48 1 7.03 1 3 5.03 3 10.5s4.03 9.5 9.48 9.5c2.79 0 5.2-1 6.9-2.73 1.95-1.95 2.6-4.84 2.6-7.39 0-.7-.07-1.3-.2-1.84h-9.3z"
          fill="currentColor"
        />
      </svg>
    );
  }

export function GoogleSignInButton() {
  const router = useRouter();
  const auth = useAuth();

  const handleSignIn = async () => {
    if (!auth) return;
    try {
        const user = await signInWithGoogle(auth);
        if (user) {
          router.push('/');
        }
    } catch (error) {
        console.error('Google Sign-In Error:', error);
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn}>
      <GoogleIcon />
      Sign in with Google
    </Button>
  );
}
