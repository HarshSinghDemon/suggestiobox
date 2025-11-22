'use client';

import { useState } from 'react';
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
import { BrainCircuit, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { codeBuddy } from '@/ai/flows/code-buddy-flow';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBuddyProps {
  codeToAnalyze: string;
  language: string;
  triggerButton?: React.ReactNode;
}

export function CodeBuddy({
  codeToAnalyze,
  language,
  triggerButton,
}: CodeBuddyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const quickActions = ["Explain this code", "Find potential bugs", "Suggest optimizations"];

  const handleQuery = async (userQuery: string) => {
    if (!userQuery.trim()) return;
    setIsLoading(true);
    setAiResponse('');
    setError(null);

    try {
      const result = await codeBuddy({
        code: codeToAnalyze,
        language: language,
        query: userQuery,
      });
      setAiResponse(result.response);
    } catch (e: any) {
      console.error("AI Code Buddy Error:", e);
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
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            AI Code Buddy
          </DialogTitle>
          <DialogDescription>
            Ask questions, find bugs, or get explanations for the code in the editor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full p-4 border rounded-md">
                {isLoading && !aiResponse && (
                    <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p>Thinking...</p>
                    </div>
                )}
                {error && (
                     <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertTitle>AI Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {aiResponse && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Markdown
                            components={{
                                code({node, inline, className, children, ...props}) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                    ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                    )
                                }
                            }}
                        >
                            {aiResponse}
                        </Markdown>
                    </div>
                )}
                 {!aiResponse && !isLoading && (
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
                    <Button key={action} variant="outline" size="sm" onClick={() => handleQuickAction(action)} disabled={isLoading}>
                       <Wand2 className="w-4 h-4 mr-2" />
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
              placeholder="e.g., 'Explain this code line by line...' or 'How can I make this more efficient?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              rows={1}
              className='text-base'
            />
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
