'use client';

import { CodeEditor } from '@/components/ide/CodeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { Code2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function CodePage() {
    // We check for the environment variable on the client to provide a clear message.
    // The actual API call will fail on the server if the key is missing, but this is for user feedback.
    const isJudge0KeySet = process.env.NEXT_PUBLIC_JUDGE0_ENABLED === 'true';

    return (
        <AuthWrapper>
            <div className="container py-8 mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                             <div className="p-3 rounded-lg bg-primary/20">
                                <Code2 className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold tracking-tight">Online Code Editor</CardTitle>
                                <CardDescription>
                                    Write, compile, and run code in multiple languages, right in your browser.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!isJudge0KeySet && (
                             <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="w-4 h-4" />
                                <AlertTitle>Configuration Error</AlertTitle>
                                <AlertDescription>
                                    The code execution service is not configured. Please set the <code className="font-semibold">JUDGE0_KEY</code> in your <code className="font-semibold">.env.local</code> file and restart the server.
                                </AlertDescription>
                            </Alert>
                        )}
                        <CodeEditor />
                    </CardContent>
                </Card>
            </div>
        </AuthWrapper