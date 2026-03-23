/**
 * API Usage Cost Tracking
 *
 * Logs API usage to the database for cost transparency.
 * Costs are calculated based on current pricing and stored in cents.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pricing per million tokens (in cents)
const PRICING: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-6': { input: 300, output: 1500 },      // $3/M in, $15/M out
    'claude-haiku-4-5-20251001': { input: 100, output: 500 },  // $1/M in, $5/M out
    'claude-3-5-haiku-20241022': { input: 100, output: 500 }, // legacy
    'claude-3-haiku-20240307': { input: 25, output: 125 },   // $0.25/M in, $1.25/M out
    'gpt-4o': { input: 250, output: 1000 },                  // $2.50/M in, $10/M out
};

// TTS pricing: $15 per 1M characters = 1500 cents per 1M chars
const TTS_COST_PER_CHAR_CENTS = 1500 / 1_000_000;

// Whisper pricing: $0.006 per minute = 0.6 cents per minute
const WHISPER_COST_PER_MINUTE_CENTS = 0.6;

interface LogUsageParams {
    userId: string;
    route: string;
    provider: 'anthropic' | 'openai';
    model: string;
    inputTokens?: number;
    outputTokens?: number;
}

/**
 * Calculate cost in cents based on model and token usage.
 */
function calculateTokenCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = PRICING[model];
    if (!pricing) return 0;

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return Math.round((inputCost + outputCost) * 10000) / 10000; // 4 decimal precision
}

/**
 * Log API usage to the database. Fire-and-forget -- does not block the response.
 */
export function logApiUsage(params: LogUsageParams): void {
    const { userId, route, provider, model, inputTokens = 0, outputTokens = 0 } = params;
    const costCents = calculateTokenCost(model, inputTokens, outputTokens);

    // Fire and forget -- don't await, don't block response
    prisma.apiUsage.create({
        data: {
            userId,
            route,
            provider,
            model,
            inputTokens: inputTokens || null,
            outputTokens: outputTokens || null,
            costCents,
        }
    }).catch(err => {
        console.error('Failed to log API usage:', err);
    });
}

/**
 * Log TTS usage based on character count.
 */
export function logTTSUsage(userId: string, charCount: number): void {
    const costCents = Math.round(charCount * TTS_COST_PER_CHAR_CENTS * 10000) / 10000;

    prisma.apiUsage.create({
        data: {
            userId,
            route: 'tts',
            provider: 'openai',
            model: 'tts-1',
            costCents,
        }
    }).catch(err => {
        console.error('Failed to log TTS usage:', err);
    });
}

/**
 * Log Whisper transcription usage based on audio duration.
 */
export function logWhisperUsage(userId: string, durationSeconds: number): void {
    const durationMinutes = durationSeconds / 60;
    const costCents = Math.round(durationMinutes * WHISPER_COST_PER_MINUTE_CENTS * 10000) / 10000;

    prisma.apiUsage.create({
        data: {
            userId,
            route: 'transcribe',
            provider: 'openai',
            model: 'whisper-1',
            costCents,
        }
    }).catch(err => {
        console.error('Failed to log Whisper usage:', err);
    });
}
