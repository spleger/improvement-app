import Anthropic from '@anthropic-ai/sdk';

export const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
    if (!_client) {
        const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^["']|["']$/g, '').trim();
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required.');
        }
        _client = new Anthropic({ apiKey });
    }
    return _client;
}
