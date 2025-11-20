
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Upload, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadFileToSupabase } from '@/lib/supabase/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type AdminProfileSettingsProps = {
    supabaseUrl: string;
    supabaseAnonKey: string;
};

export function AdminProfileSettings({ supabaseUrl, supabaseAnonKey }: AdminProfileSettingsProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    const [newImageUrl, setNewImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getInitials = (name?: string | null) => {
        if (!name) return 'A';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { url } = await uploadFileToSupabase(file, supabaseUrl, supabaseAnonKey);
            await handleSave(url);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message || 'Could not upload the file.',
            });
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newImageUrl) return;
        await handleSave(newImageUrl);
    }

    const handleSave = async (url: string) => {
        if (!user || !firestore || !auth.currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile(auth.currentUser, { photoURL: url });
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, { photoURL: url });
            
            toast({
                title: 'Success!',
                description: 'Your profile picture has been updated.',
            });
            setNewImageUrl('');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: error.message || 'Could not update your profile picture.',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isLoading = isUploading || isSaving;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your administrator profile details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 md:flex-row">
                <div className="flex-shrink-0">
                    <Avatar className="w-24 h-24 border-2 border-primary">
                        <AvatarImage src={user?.photoURL ?? undefined} alt="Admin Avatar" />
                        <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="w-full flex-1">
                    <Tabs defaultValue="upload">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload File</TabsTrigger>
                            <TabsTrigger value="url"><Link className="w-4 h-4 mr-2" />From URL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="dp-upload">Upload a new picture</Label>
                                <Input 
                                    id="dp-upload"
                                    type="file" 
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                    accept="image/png, image/jpeg, image/gif"
                                />
                                <p className="text-xs text-muted-foreground">Max file size: 5MB. Recommended square image.</p>
                                {isUploading && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</div>}
                            </div>
                        </TabsContent>
                        <TabsContent value="url" className="pt-4">
                            <form onSubmit={handleUrlSubmit} className="space-y-2">
                                <Label htmlFor="dp-url">Or paste an image URL</Label>
                                <div className="flex gap-2">
                                <Input 
                                    id="dp-url"
                                    type="url" 
                                    placeholder="https://example.com/image.png"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Button type="submit" disabled={isLoading || !newImageUrl}>
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save
                                </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}
