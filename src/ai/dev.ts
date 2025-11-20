'use client';
import { config } from 'dotenv';
config();

import '@/ai/flows/check-suggestion-for-offensive-language.ts';
import '@/ai/flows/moderate-text.ts';
import '@/ai/flows/validate-email.ts';
