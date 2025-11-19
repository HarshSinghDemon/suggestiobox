
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { signInWithGoogle, signInWithGitHub } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.64-3.657-11.303-8H4.239v8.01C8.223 40.522 15.638 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-0.792 2.237-2.231 4.16-4.087 5.571l6.19 5.238C44.572 36.836 48 30.825 48 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.801 24 17.302 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);


export function SocialLogins() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const auth = useFirebaseAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    const setLoading = provider === 'google' ? setGoogleLoading : setGithubLoading;
    const signInMethod = provider === 'google' ? signInWithGoogle : signInWithGitHub;
    
    setLoading(true);
    try {
      const { isNewUser } = await signInMethod(auth);
      if (isNewUser) {
        router.push('/complete-profile');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      // Gracefully handle popup closed by user, which is not a true error.
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error(`Error with ${provider} sign-in:`, error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || `Could not sign in with ${provider}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
        <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" disabled={googleLoading || githubLoading} onClick={() => handleSocialLogin('google')}>
                {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <GoogleIcon />
                )}
                <span className='ml-2'>Google</span>
            </Button>
            <Button variant="outline" type="button" disabled={googleLoading || githubLoading} onClick={() => handleSocialLogin('github')}>
                {githubLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <GitHubIcon />
                )}
                <span className='ml-2'>GitHub</span>
            </Button>
        </div>
    </div>
  );
}
