
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Upload, ArrowRight, Loader2, Wand2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDoc, arrayUnion, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useImageKit } from '@/lib/imagekit/imagekit-provider';
import type { FirebaseUser } from '@/lib/types';
import { FriendSelectionStep } from './friend-selection-step';

export function CreateGroupForm() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { upload } = useImageKit();
    const router = useRouter();
    const { toast } = useToast();

    const [step, setStep] = useState(1);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedFriends, setSelectedFriends] = useState<FirebaseUser[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleNextStep = () => {
        if (!groupName.trim()) {
            toast({ variant: 'destructive', title: 'Group name is required' });
            return;
        }
        setStep(2);
    };

    const handleCreateGroup = async () => {
        if (!user || !firestore || selectedFriends.length === 0) {
            toast({ variant: 'destructive', title: 'Cannot create group', description: 'You must select at least one friend.' });
            return;
        }
        setIsSubmitting(true);
        let photoURL = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(groupName);

        try {
            if (avatarFile) {
                const result = await upload(avatarFile, {
                    fileName: avatarFile.name,
                    folder: '/group-avatars',
                });
                photoURL = result.url;
            }
            
            const participantIds = [user.uid, ...selectedFriends.map(f => f.id)];

            const groupDocRef = await addDoc(collection(firestore, 'groupChatRooms'), {
                name: groupName,
                description: groupDescription,
                photoURL: photoURL,
                participants: participantIds,
                admins: [user.uid],
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                lastMessage: null,
            });

            // Add group ID to each participant's user document
            const batchPromises = participantIds.map(id => {
                const userDocRef = doc(firestore, 'users', id);
                return updateDoc(userDocRef, {
                    groupChatRoomIds: arrayUnion(groupDocRef.id)
                });
            });

            await Promise.all(batchPromises);

            toast({ title: 'Group Created!', description: `"${groupName}" is now live.` });
            router.push(`/messages/group/${groupDocRef.id}`);

        } catch (error: any) {
            console.error('Failed to create group:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not create the group.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/20">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Wand2 className="w-7 h-7 text-purple-400" />
                    Create a New Universe
                </h2>
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <div className="relative w-40 h-2 rounded-full bg-white/10">
                        <div className="absolute top-0 left-0 h-2 bg-purple-400 rounded-full transition-all duration-300" style={{ width: `${step === 1 ? '50%' : '100%'}` }}></div>
                    </div>
                    <span>Step {step}/2</span>
                </div>
            </div>

            {step === 1 && (
                <div className="flex-1 py-6 space-y-6 animate-fade-in-scale">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-white/20">
                                <AvatarImage src={avatarPreview || undefined} />
                                <AvatarFallback className="bg-white/10"><Users className="w-10 h-10" /></AvatarFallback>
                            </Avatar>
                            <Button size="icon" className="absolute bottom-0 right-0 w-8 h-8 rounded-full" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-4 h-4" />
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        </div>
                        <div className="flex-1 space-y-2">
                             <label htmlFor="groupName" className="font-semibold">Group Name</label>
                            <Input
                                id="groupName"
                                placeholder="e.g., The Meme Team, Study Squad..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="h-12 text-lg bg-white/10 border-white/20 focus-visible:ring-purple-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="groupDescription" className="font-semibold">Description</label>
                        <Textarea
                            id="groupDescription"
                            placeholder="What's the mission of this group?"
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                             className="min-h-[100px] mt-2 bg-white/10 border-white/20 focus-visible:ring-purple-400"
                        />
                    </div>
                     <div className="flex justify-end pt-4">
                        <Button onClick={handleNextStep} size="lg" className="rounded-full bg-purple-600 hover:bg-purple-700">
                            Next: Add Friends
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col flex-1 py-6 animate-fade-in-scale">
                    <FriendSelectionStep
                        onSelectionChange={setSelectedFriends}
                        initialSelection={selectedFriends}
                    />
                    <div className="flex justify-between pt-6 mt-auto border-t border-white/20">
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={handleCreateGroup} size="lg" className="rounded-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                            {isSubmitting ? 'Creating Group...' : 'Finish & Create Group'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
