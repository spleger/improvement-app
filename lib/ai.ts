import OpenAI from 'openai';
import { Goal, Challenge, UserPrefs, Message, ShiftSuggestion } from './types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key', // Fallback for build time/test without env
    dangerouslyAllowBrowser: true, // In case this runs client side, but it should be server
});

export const SYSTEM_PROMPTS = {
    TOUGH_LOVE: "You are a drill sergeant. No excuses. Push the user beyond their limits.",
    SCIENTIFIC: "Cite studies. Be analytical. Focus on transformation through neuroplasticity and behavioral science.",
    EMPATHETIC: "Be understanding and supportive. Focus on emotional well-being and steady progress."
};

export async function generateChallenge(userPrefs: UserPrefs, goal: Goal, recentChallenges: Challenge[] = []): Promise<Partial<Challenge>> {
    const historyText = recentChallenges.length > 0
        ? recentChallenges.map(c => `- ${c.title} (Difficulty: ${c.difficulty})`).join('\n')
        : 'No recent history.';

    const prompt = `
    Generate a challenge for a user with the goal: "${goal.title}" (${goal.description}).
    Current State: ${goal.currentState}
    Desired State: ${goal.desiredState}
    
    User Preferences:
    - Difficulty: ${userPrefs.preferredDifficulty}/10
    - Focus Areas: ${userPrefs.focusAreas.join(', ')}
    - Avoid: ${userPrefs.avoidAreas.join(', ')}
    - Reality Shift: ${userPrefs.realityShiftEnabled ? 'ON' : 'OFF'}

    Recent Completed Challenges:
    ${historyText}

    Instructions:
    - Do NOT repeat recent challenges.
    - If Reality Shift is ON, slightly increase difficulty from preference.
    - Otherwise, keep it consistent with preference.
    
    Return a JSON object with:
    - title
    - description
    - instructions
    - difficulty (number 1-10)
    - isRealityShift (boolean)
    - estimatedDuration (minutes)
  `;

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: 'You are a challenge generator. Output JSON only.' }, { role: 'user', content: prompt }],
        model: 'gpt-4o', // or gpt-3.5-turbo
        response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content received from AI');

    const data = JSON.parse(content);

    return {
        title: data.title,
        description: data.description,
        // instructions: data.instructions, // Challenge interface might need this if implied by template
        difficulty: data.difficulty,
        isRealityShift: data.isRealityShift,
        // Map other fields as needed
    } as Partial<Challenge>;
}

export async function transcribeAudio(audioFile: Blob | File): Promise<string> {
    const transcription = await openai.audio.transcriptions.create({
        file: audioFile as any, // OpenAI SDK expects a File-like object
        model: 'whisper-1',
    });

    return transcription.text;
}

export async function chatWithExpert(messages: Message[], persona: UserPrefs['aiPersonality']): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    let systemPrompt = SYSTEM_PROMPTS.EMPATHETIC;
    if (persona === 'tough_love') systemPrompt = SYSTEM_PROMPTS.TOUGH_LOVE;
    if (persona === 'scientific') systemPrompt = SYSTEM_PROMPTS.SCIENTIFIC;

    const stream = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        model: 'gpt-4o',
        stream: true,
    });

    return stream;
}

export async function analyzeRealityShift(userProfile: any): Promise<ShiftSuggestion> {
    // Placeholder implementation for roadmap item 1
    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: 'Analyze user for reality shift. Return JSON.' },
            { role: 'user', content: JSON.stringify(userProfile) }
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content || '{}';
    const data = JSON.parse(content);

    return {
        isShiftRecommended: data.isShiftRecommended || false,
        reasoning: data.reasoning || 'No data',
        intensity: data.intensity || 1,
        suggestedFocus: data.suggestedFocus || 'General'
    };
}
