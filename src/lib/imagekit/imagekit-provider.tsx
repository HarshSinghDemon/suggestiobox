
'use client';

import React, { createContext, useContext, useMemo, ReactNode, useState } from 'react';
import IK from 'imagekit-javascript';
import type { IKCore } from 'imagekit-javascript/dist/types/interfaces/IKCore';
import type { UploadResponse } from 'imagekit-javascript/dist/types/interfaces/UploadResponse';
import { useToast } from '@/hooks/use-toast';

interface ImageKitContextType {
  ikInstance: IKCore | null;
  upload: (file: File, options: { fileName: string; folder?: string }) => Promise<UploadResponse>;
}

const ImageKitContext = createContext<ImageKitContextType | undefined>(undefined);

export const ImageKitProvider = ({ children }: { children: ReactNode }) => {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const ikInstance = useMemo(() => {
        const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
        const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

        if (typeof window !== 'undefined' && publicKey && urlEndpoint) {
            return new IK({
                publicKey,
                urlEndpoint,
                authenticationEndpoint: '/api/imagekit-auth',
            });
        }
        return null;
    }, []);

    const upload = async (file: File, options: { fileName: string; folder?: string }): Promise<UploadResponse> => {
        if (!ikInstance) {
            const error = new Error("ImageKit is not initialized. Please check your environment variables.");
            toast({
                variant: 'destructive',
                title: 'Configuration Error',
                description: error.message
            });
            return Promise.reject(error);
        }

        // Pre-flight check to the authentication endpoint
        try {
            const authCheck = await fetch('/api/imagekit-auth');
            if (!authCheck.ok) {
                const errorData = await authCheck.json();
                throw new Error(errorData.error || 'Failed to authenticate with ImageKit server.');
            }
        } catch (authError: any) {
            toast({
                variant: 'destructive',
                title: 'Authentication Failed',
                description: authError.message
            });
            return Promise.reject(authError);
        }

        setIsUploading(true);

        return new Promise((resolve, reject) => {
            ikInstance.upload({
                file,
                ...options,
            }, (err, result) => {
                setIsUploading(false);
                if (err) {
                    console.error("ImageKit Upload Error:", err);
                    const errorMessage = (err as any)?.message || 'Could not upload the file.';
                    toast({
                        variant: 'destructive',
                        title: 'Upload Failed',
                        description: errorMessage
                    });
                    reject(new Error(errorMessage));
                } else if (result) {
                    toast({
                        title: 'Upload Successful',
                        description: `${result.name} has been uploaded.`,
                    });
                    resolve(result);
                }
            });
        });
    };
    
    const value = { ikInstance, upload };

    return (
        <ImageKitContext.Provider value={value}>
            {children}
        </ImageKitContext.Provider>
    );
};

export const useImageKit = () => {
    const context = useContext(ImageKitContext);
    if (context === undefined) {
        throw new Error('useImageKit must be used within an ImageKitProvider');
    }
    return context;
};
