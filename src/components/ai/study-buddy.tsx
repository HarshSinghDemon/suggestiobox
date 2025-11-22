'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { studyBuddy } from '@/ai/flows/study-buddy-flow';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, FileCheck2 } from 'lucide-react';

interface StudyBuddyProps {
  contentToAnalyze: string;
  fileUrl?: string | null;
  triggerButton?: React.ReactNode;
}

const blobToDataURI = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


export function StudyBuddy({
  contentToAnalyze,
  fileUrl,
  triggerButton,
}: StudyBuddyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  
  const quickActions = ["Summarize the key points", "Explain this like I'm a beginner", "Create 3 practice questions based on this"];

  useEffect(() => {
    if (isOpen && fileUrl && !fileDataUri) {
        setIsFetchingFile(true);
        setError(null);
        fetch(fileUrl)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
                return res.blob();
            })
            .then(blob => blobToDataURI(blob))
            .then(dataUri => setFileDataUri(dataUri))
            .catch(e => {
                console.error("Failed to load PDF for AI:", e);
                setError("Could not load the associated file for the AI to read. The AI can only see the description.");
            })
            .finally(() => setIsFetchingFile(false));
    }
  }, [isOpen, fileUrl, fileDataUri]);

  const handleQuery = async (userQuery: string) => {
    if (!userQuery.trim()) return;
    setIsLoading(true);
    setAiResponse('');
    setError(null);

    try {
      const result = await studyBuddy({
        content: contentToAnalyze,
        query: userQuery,
        fileDataUri: fileDataUri || undefined,
      });
      setAiResponse(result.response);
    } catch (e: any) {
      console.error("AI Study Buddy Error:", e);
      setError(e.message || "An unexpected error occurred with the AI.");
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  const handleQuickAction = (action: string) => {
    setQuery(action);
    handleQuery(action);
  }
  
  const isLoadingAnything = isLoading || isFetchingFile;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? (
         <div onClick={() => setIsOpen(true)}>{triggerButton}</div>
      ) : (
        <Button variant="outline" onClick={() => setIsOpen(true)}>
            <BrainCircuit className="w-4 h-4 mr-2" />
            Ask AI
        </Button>
      )}
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            AI Study Buddy
          </DialogTitle>
          <DialogDescription>
            Ask questions, get summaries, or generate practice questions based on the content.
          </DialogDescription>
        </DialogHeader>
        {fileUrl && (
            <div className='px-6'>
                <Alert variant={fileDataUri ? "default" : isFetchingFile ? "default" : "destructive"}>
                    {isFetchingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
                    <AlertTitle>
                        {isFetchingFile ? "Analyzing File..." : fileDataUri ? "File Ready for AI" : "File Error"}
                    </AlertTitle>
                    <AlertDescription>
                        {isFetchingFile ? "The AI is preparing to read the attached file." : fileDataUri ? "The AI will now use the attached file as its primary source of information." : "Could not load the file. The AI will only use the text description."}
                    </AlertDescription>
                </Alert>
            </div>
        )}
        <div className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full p-4 border rounded-md">
                {isLoading && !aiResponse && (
                    <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p>Thinking...</p>
                    </div>
                )}
                {error && !isFetchingFile && (
                     <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertTitle>AI Error</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}
                {aiResponse && (
                    <div className="space-y-4 whitespace-pre-wrap">
                        {aiResponse}
                    </div>
                )}
                 {!aiResponse && !isLoading && !isFetchingFile && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center text-muted-foreground">
                        <Sparkles className="w-12 h-12 text-primary/50" />
                        <h3 className='text-lg font-semibold'>Ready to help!</h3>
                        <p className='text-sm'>Use a quick action below or type your own question.</p>
                    </div>
                )}
            </ScrollArea>
        </div>
        <DialogFooter className="flex flex-col gap-2 pt-4">
            <div className="flex flex-wrap gap-2">
                {quickActions.map(action => (
                    <Button key={action} variant="outline" size="sm" onClick={() => handleQuickAction(action)} disabled={isLoadingAnything}>
                       {action}
                    </Button>
                ))}
            </div>
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(query);
            }}
          >
            <Textarea
              placeholder="Ask a question about the content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoadingAnything}
              rows={1}
              className='text-base'
            />
            <Button type="submit" disabled={isLoadingAnything || !query.trim()}>
              {isLoadingAnything ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
