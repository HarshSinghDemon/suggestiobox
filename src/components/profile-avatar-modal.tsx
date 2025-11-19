
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
import { Loader2, RefreshCw } from 'lucide-react';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
    'pixel-art': 'Pixel Art',
    'lorelei': 'Illustrative',
    'miniavs': 'Minimalist',
};

type AvatarStyleKey = keyof typeof AVATAR_STYLES;


export function ProfileAvatarModal({ isOpen, onOpenChange }: ProfileAvatarModalProps) {
  const { user } = useUser();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleKey>('notionists');

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
  
  const handleSave = async () => {
    if (!newAvatarUrl || !user || !auth.currentUser || !firestore) return;

    setIsSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { photoURL: newAvatarUrl });
      
      // Update Firestore user document
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { photoURL: newAvatarUrl });

      toast({
        title: 'Avatar Updated!',
        description: 'Your new avatar has been saved.',
      });
      onOpenChange(false);
      setNewAvatarUrl(null); // Reset for next time
    } catch (error) {
      console.error("Failed to update avatar:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your new avatar. Please try again.',
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Your Avatar</DialogTitle>
          <DialogDescription>
            Randomize your robot avatar and save your new look.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="relative w-48 h-48 rounded-full bg-muted">
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
            <Button variant="outline" onClick={handleRandomize}>
                <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onModalStateChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !newAvatarUrl}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
