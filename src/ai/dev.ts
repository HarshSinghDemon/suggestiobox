'use client';
import { config } from 'dotenv';
config();

import '@/ai/flows/check-suggestion-for-offensive-language.ts';
import '@/ai/flows/moderate-text.ts';
import '@/ai/flows/validate-email.ts';
import '@/ai/flows/study-buddy-flow.ts';
import '@/ai/flows/code-buddy-flow.ts';
import '@/ai/flows/pookie-ai-flow.ts';
import '@/ai/flows/city-guesser-flow.ts';
