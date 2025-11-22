'use client';

import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Play, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Textarea } from '../ui/textarea';
import { CodeBuddy } from './code-buddy';


const languageOptions = [
  { value: 71, label: 'Python (General Purpose)', category: 'General' },
  { value: 63, label: 'JavaScript (Node.js)', category: 'General' },
  { value: 62, label: 'Java', category: 'General' },
  { value: 54, label: 'C++', category: 'General' },
  { value: 50, label: 'C', category: 'General' },
  { value: 51, label: 'C#', category: 'General' },
  { value: 'coming_soon', label: 'Python (Data Science)', category: 'Data Science', disabled: true },
];

const languageTemplates: Record<string, string> = {
  python: `def main():
    try:
        # Example of reading from stdin
        name = input("Enter your name: ")
        print(f"Hello, {name}!")
    except EOFError:
        print("Hello from Python! Provide input to interact.")

if __name__ == "__main__":
    main()`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("Enter your name: ");
        if (scanner.hasNextLine()) {
            String name = scanner.nextLine();
            System.out.println("Hello, " + name + "!");
        } else {
            System.out.println("Hello from Java! Provide input to interact.");
        }
        scanner.close();
    }
}`,
  cpp: `#include <iostream>
#include <string>

int main() {
    std::string name;
    std::cout << "Enter your name: " << std::endl;
    if (std::getline(std::cin, name)) {
        std::cout << "Hello, " << name << "!" << std::endl;
    } else {
        std::cout << "Hello from C++! Provide input to interact." << std::endl;
    }
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    char name[100];
    printf("Enter your name: \\n");
    if (fgets(name, sizeof(name), stdin) != NULL) {
        printf("Hello, %s", name);
    } else {
        printf("Hello from C! Provide input to interact.\\n");
    }
    return 0;
}`,
  javascript: `const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Enter your name: ");

rl.on('line', (name) => {
  console.log(\`Hello, \${name}!\`);
  rl.close();
});

rl.on('close', () => {
  // This will run if no input is provided after a short time
});`,
  csharp: `using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Enter your name: ");
        string name = Console.ReadLine();
        if (name != null)
        {
            Console.WriteLine($"Hello, {name}!");
        }
        else
        {
            Console.WriteLine("Hello from C#! Provide input to interact.");
        }
    }
}`,
};

const languageIdToName: Record<number, string> = {
    71: 'python',
    62: 'java',
    54: 'cpp',
    50: 'c',
    63: 'javascript',
    51: 'csharp',
};

export function CodeEditor() {
    const [language, setLanguage] = useState(languageOptions[0].value);
    const [code, setCode] = useState(languageTemplates[languageIdToName[languageOptions[0].value as number]]);
    const [stdin, setStdin] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    const handleLanguageChange = (value: string) => {
        if(value === 'coming_soon') return;
        const langId = parseInt(value, 10);
        const langName = languageIdToName[langId];
        setLanguage(langId);
        setCode(languageTemplates[langName] || '');
        setOutput('');
        setError(null);
    };

    const handleRunCode = async () => {
        setIsLoading(true);
        setOutput('');
        setError(null);
        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language,
                    stdin: stdin,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to execute code.');
            }

            const data = await res.json();
            setOutput(data.output);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, error]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="w-full sm:w-64">
                    <Select onValueChange={handleLanguageChange} defaultValue={String(language)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {languageOptions.map(opt => 
                                opt.disabled ? (
                                    <TooltipProvider key={opt.value}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="relative flex w-full cursor-not-allowed select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-muted-foreground outline-none">
                                                    {opt.label}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>This environment does not support third-party libraries like Numpy or Matplotlib yet.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                    <Button onClick={handleRunCode} disabled={isLoading} className="flex-1 w-full sm:w-auto">
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Run Code
                            </>
                        )}
                    </Button>
                     <CodeBuddy 
                        codeToAnalyze={code} 
                        language={typeof language === 'number' ? languageIdToName[language] : 'plaintext'}
                        triggerButton={
                             <Button variant="outline" className="flex-1 w-full sm:w-auto">
                                <BrainCircuit className="w-4 h-4 mr-2" />
                                Ask AI
                            </Button>
                        } 
                    />
                </div>
            </div>
            
            <div className="border rounded-lg bg-card overflow-hidden">
                <Editor
                    height="50vh"
                    language={typeof language === 'number' ? languageIdToName[language] : 'plaintext'}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        minimap: { enabled: true },
                        contextmenu: true,
                        scrollBeyondLastLine: false,
                    }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="mb-2 text-lg font-semibold">Input (stdin)</h3>
                    <Textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="Provide standard input to your program here..."
                        className="h-48 font-mono text-sm bg-[#0D1117] text-white"
                    />
                </div>
                <div>
                    <h3 className="mb-2 text-lg font-semibold">Output</h3>
                    <ScrollArea className="h-48 w-full font-mono text-sm border rounded-md bg-[#0D1117] text-green-400 p-4 whitespace-pre-wrap">
                        <div ref={outputRef}>
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Executing code...</span>
                                </div>
                            ) : error ? (
                                <pre className="text-red-400">{error}</pre>
                            ) : output ? (
                                <pre>{output}</pre>
                            ) : (
                                <span className="text-gray-500">Output will be displayed here.</span>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
