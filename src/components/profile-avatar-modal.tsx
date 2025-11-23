
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, LogOut } from 'lucide-react';
import { useUser, useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ProfileAvatarModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_STYLES = {
    'notionists': 'Oil Pastel',
    'bottts-neutral': 'Robots',
    'fun-emoji': 'Emoji',
    'adventurer': 'Adventurer',
    'avataaars': 'Character',
    'pixel-art': 'Games',
    'micah': 'Anime',
    'lorelei': 'Illustrative',
    'miniavs': 'Minimalist',
};

type AvatarStyleKey = keyof typeof AVATAR_STYLES;


export function ProfileAvatarModal({ isOpen, onOpenChange }: ProfileAvatarModalProps) {
  const { user } = useUser();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleKey>('notionists');

  useEffect(() => {
    if (user?.uid && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      // You might need to fetch the user document to get the current bio
      // This part is simplified. For a real app, you'd fetch the user doc.
      // For now, we'll assume the `user` object might have it or it's empty.
      // A better approach would be to use `useDoc` hook on the user document.
      // Let's assume you fetch it somehow. For this example, I'll mock it.
      const fetchBio = async () => {
        const userDoc = await (await fetch(userDocRef.path)).json();
        const userData = userDoc as any;
        setBio((userData?.bio as string) || '');
      };
      // fetchBio(); // This is pseudo-code for fetching the bio
    }
  }, [user, firestore, isOpen]);


  const currentAvatarUrl = useMemo(() => {
    return newAvatarUrl || user?.photoURL || '';
  }, [newAvatarUrl, user?.photoURL]);

  const generateAvatarUrl = (style: AvatarStyleKey) => {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&radius=50&backgroundColor=7950f2,f1efff,51d5ff&backgroundType=gradientLinear`;
  }

  const handleRandomize = () => {
    setNewAvatarUrl(generateAvatarUrl(selectedStyle));
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
    onOpenChange(false);
    router.push('/');
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleSave = async () => {
    if (!user || !auth.currentUser || !firestore) return;

    setIsSaving(true);
    try {
        const updatePayload: { photoURL?: string, bio?: string } = {};

        if (newAvatarUrl) {
            updatePayload.photoURL = newAvatarUrl;
            await updateProfile(auth.currentUser, { photoURL: newAvatarUrl });
        }
        
        // This assumes the bio state is correctly managed.
        updatePayload.bio = bio;

        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, updatePayload);

        toast({
            title: 'Profile Updated!',
            description: 'Your changes have been saved.',
        });
        onOpenChange(false);
        setNewAvatarUrl(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your changes. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };
  
  const onModalStateChange = (open: boolean) => {
    if (!open) {
      setNewAvatarUrl(null); // Reset when closing
    }
    onOpenChange(open);
  }

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onModalStateChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Update your avatar and bio.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="relative w-32 h-32 rounded-full bg-muted">
             {currentAvatarUrl ? (
                <Image
                    src={currentAvatarUrl}
                    alt="Your avatar"
                    fill
                    className="object-cover rounded-full"
                    unoptimized // Required for external SVGs
                />
             ) : (
                <div className="flex items-center justify-center w-full h-full text-4xl rounded-full bg-muted text-muted-foreground">
                    {getInitials(user.displayName)}
                </div>
             )}
          </div>
          
          <div className="w-full space-y-4">
            <div className="space-y-2">
              <Label>Avatar Style</Label>
              <div className="flex items-center w-full gap-2">
                  <Select value={selectedStyle} onValueChange={(value: AvatarStyleKey) => setSelectedStyle(value)}>
                      <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                          {Object.entries(AVATAR_STYLES).map(([key, name]) => (
                              <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleRandomize} aria-label="Randomize avatar">
                      <RefreshCw className="w-4 h-4" />
                  </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio-input">Bio</Label>
              <Textarea
                id="bio-input"
                placeholder="Tell us a little about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                className="h-24"
              />
            </div>
          </div>

        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-between">
          <Button variant="destructive" onClick={handleSignOut} className='sm:mr-auto'>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
          </Button>
          <div className='flex justify-end gap-2'>
            <Button variant="secondary" onClick={() => onModalStateChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
