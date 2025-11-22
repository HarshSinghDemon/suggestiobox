'use client';

import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "../ui/skeleton";
import { Code, Bot } from "lucide-react";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";

// This is a mock editor. A real implementation would use a library like Monaco or CodeMirror.
function MockCodeEditor({ value, onChange, onFocus, onBlur, readOnly }: { value: string, onChange: (value: string) => void, onFocus: () => void, onBlur: () => void, readOnly: boolean }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            readOnly={readOnly}
            className="w-full h-full p-4 font-mono text-sm resize-none bg-background text-foreground focus:outline-none"
            placeholder="Start coding here..."
        />
    )
}

export function LiveCodeEditor({ roomId }: { roomId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    
    // Document reference for the shared code
    const codeDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'chatRooms', roomId, 'sharedCode', 'live');
    }, [firestore, roomId]);

    const { data: codeData, isLoading: isLoadingCode } = useDoc<{ content: string; lastEditorId: string }>(codeDocRef);

    const [localCode, setLocalCode] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    
    const [debouncedCode] = useDebounce(localCode, 500);

    // Update local state when Firestore data changes, but only if not focused
    useEffect(() => {
        if (codeData && !isFocused) {
            // Only update if the change is from the other user
            if (codeData.lastEditorId !== user?.uid) {
                setLocalCode(codeData.content);
            }
        } else if (!codeData && !isLoadingCode) {
            // If no data exists, initialize local state
            setLocalCode("");
        }
    }, [codeData, isFocused, user?.uid, isLoadingCode]);

    // Write to Firestore when debounced local code changes
    useEffect(() => {
        if (isFocused && codeDocRef && user) {
            setDoc(codeDocRef, {
                content: debouncedCode,
                lastEditorId: user.uid,
                updatedAt: serverTimestamp()
            }, { merge: true }).catch(error => {
                console.error("Failed to sync code:", error);
            });
        }
    }, [debouncedCode, codeDocRef, user, isFocused]);

    const handleCodeChange = (newCode: string) => {
        setLocalCode(newCode);
    };

    if (isLoadingCode) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b shrink-0">
                    <Skeleton className="w-48 h-6" />
                </div>
                <div className="flex-1 p-4">
                    <Skeleton className="w-full h-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="flex items-center h-16 gap-3 px-4 border-b shrink-0">
                <Code className="w-6 h-6 text-primary" />
                <div>
                    <h3 className="font-semibold">Live Code Editor</h3>
                    <p className={cn(
                        "text-xs text-muted-foreground transition-opacity",
                        isFocused ? "opacity-100" : "opacity-0"
                    )}>
                        Syncing...
                    </p>
                </div>
            </header>
            <div className="flex-1 min-h-0">
                <MockCodeEditor
                    value={localCode}
                    onChange={handleCodeChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    readOnly={!user}
                />
            </div>
             <footer className="flex items-center justify-center p-2 text-xs border-t text-muted-foreground shrink-0">
                <Bot className="w-3.5 h-3.5 mr-2" />
                This is a simple real-time text editor. For a full IDE experience, copy the code to your local editor.
            </footer>
        </div>
    )
}
