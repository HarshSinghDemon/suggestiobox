import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const apiKey = process.env.JUDGE0_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Judge0 API key is not configured.' }, { status: 500 });
    }

    try {
        const { source_code, language_id, stdin } = await request.json();

        if (!source_code || !language_id) {
            return NextResponse.json({ error: 'Source code and language ID are required.' }, { status: 400 });
        }

        const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
            body: JSON.stringify({
                source_code: btoa(source_code),
                language_id,
                stdin: stdin ? btoa(stdin) : undefined,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Judge0 API Error:', errorData);
            return NextResponse.json({ error: `API Error: ${errorData.message || 'Failed to execute code.'}` }, { status: response.status });
        }

        const result = await response.json();

        let output = '';
        if (result.status.id === 3) { // Accepted
            output = result.stdout ? atob(result.stdout) : '';
        } else if (result.status.id === 6) { // Compilation Error
            output = result.compile_output ? atob(result.compile_output) : 'Compilation Error';
        } else if (result.status.description) { // Other errors (Runtime Error, Time Limit Exceeded)
            output = result.status.description;
            if(result.stderr) {
                output += `\n${atob(result.stderr)}`;
            }
        } else {
            output = 'An unknown error occurred during execution.';
        }

        return NextResponse.json({ output });

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}