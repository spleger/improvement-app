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

export async function generateChallenge(userPrefs: UserPrefs, goal: Goal, recentChallenges: Challenge[] = [], focusArea?: string): Promise<Partial<Challenge>> {
    const historyText = recentChallenges.length > 0
        ? recentChallenges.map(c => `- ${c.title} (Difficulty: ${c.difficulty})`).join('\n')
        : 'No recent history.';

    const focusAreaInstructions = focusArea
        ? `Focus Area: The user specifically wants to work on "${focusArea}". Design the challenge around this focus.`
        : '';

    const prompt = `
You are an expert personal development coach creating a SPECIFIC, ACTIONABLE challenge.

GOAL CONTEXT:
- Title: "${goal.title}"
- Description: ${goal.description || 'Not provided'}
- Current State: ${goal.currentState || 'Starting point'}
- Desired State: ${goal.desiredState || 'Goal achieved'}

USER PREFERENCES:
- Preferred Difficulty: ${userPrefs.preferredDifficulty}/10
- Focus Areas: ${userPrefs.focusAreas.length > 0 ? userPrefs.focusAreas.join(', ') : 'General improvement'}
- Areas to Avoid: ${userPrefs.avoidAreas.length > 0 ? userPrefs.avoidAreas.join(', ') : 'None specified'}
- Reality Shift Mode: ${userPrefs.realityShiftEnabled ? 'ON (push boundaries)' : 'OFF (steady progress)'}

${focusAreaInstructions}

RECENT COMPLETED CHALLENGES (avoid repeating these):
${historyText}

CRITICAL INSTRUCTIONS:
1. Create a SPECIFIC, ACTIONABLE challenge - NOT a vague description of the goal
2. The challenge should be completable in ONE day or session
3. Include concrete steps, numbers, or measurable outcomes
4. Make it progressively build toward the goal (not just reword the goal)
5. If Reality Shift is ON, make it slightly uncomfortable but achievable

CHALLENGE TYPES TO CONSIDER:
- Physical action (do X for Y minutes)
- Reflection exercise (journal about X, analyze Y)
- Skill practice (practice Z technique 3 times)
- Social challenge (reach out to 1 person, share X)
- Habit building (implement small routine change)
- Research task (learn about X, find 3 resources on Y)

BAD EXAMPLE (too vague): "Work on improving your fitness"
GOOD EXAMPLE: "Complete a 20-minute walk in your neighborhood before 9am. Notice 3 things you've never seen before."

Return a JSON object with:
- title: Short, action-oriented title (max 60 chars)
- description: 2-3 sentences explaining the challenge and why it matters
- instructions: Step-by-step guide to complete the challenge (use numbered list)
- difficulty: Number 1-10 matching user preference (adjust if Reality Shift ON)
- isRealityShift: Boolean - true if this pushes beyond comfort zone
- estimatedDuration: Number in minutes (realistic estimate)
- successCriteria: Clear definition of what "done" looks like
`;

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a challenge generator specialized in creating actionable, specific personal development challenges. You NEVER create vague challenges that just restate goals. Output JSON only.' },
            { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content received from AI');

    const data = JSON.parse(content);

    return {
        title: data.title,
        description: data.description,
        personalizationNotes: data.instructions || data.successCriteria,
        difficulty: data.difficulty,
        isRealityShift: data.isRealityShift,
    } as Partial<Challenge>;
}

/**
 * Generate multiple distinct challenges at once
 */
export async function generateMultipleChallenges(
    count: number,
    userPrefs: UserPrefs,
    goal: Goal,
    recentChallenges: Challenge[] = [],
    focusArea?: string
): Promise<Partial<Challenge>[]> {
    const clampedCount = Math.min(Math.max(count, 1), 5);

    const historyText = recentChallenges.length > 0
        ? recentChallenges.map(c => `- ${c.title} (Difficulty: ${c.difficulty})`).join('\n')
        : 'No recent history.';

    const focusAreaInstructions = focusArea
        ? `Focus Area: The user specifically wants to work on "${focusArea}". Design challenges around this focus.`
        : '';

    const prompt = `
You are an expert personal development coach creating ${clampedCount} DISTINCT, SPECIFIC, ACTIONABLE challenges.

GOAL CONTEXT:
- Title: "${goal.title}"
- Description: ${goal.description || 'Not provided'}
- Current State: ${goal.currentState || 'Starting point'}
- Desired State: ${goal.desiredState || 'Goal achieved'}

USER PREFERENCES:
- Preferred Difficulty: ${userPrefs.preferredDifficulty}/10
- Focus Areas: ${userPrefs.focusAreas.length > 0 ? userPrefs.focusAreas.join(', ') : 'General improvement'}
- Areas to Avoid: ${userPrefs.avoidAreas.length > 0 ? userPrefs.avoidAreas.join(', ') : 'None specified'}
- Reality Shift Mode: ${userPrefs.realityShiftEnabled ? 'ON (push boundaries)' : 'OFF (steady progress)'}

${focusAreaInstructions}

RECENT COMPLETED CHALLENGES (avoid repeating these):
${historyText}

CRITICAL INSTRUCTIONS:
1. Create ${clampedCount} DIFFERENT challenges - each must be unique in approach
2. Each challenge should be SPECIFIC and ACTIONABLE (not vague goal rewording)
3. Each challenge should be completable in ONE day or session
4. Include concrete steps, numbers, or measurable outcomes
5. Vary the challenge TYPES across the set
6. Progress difficulty slightly across challenges (easiest first)
7. If Reality Shift is ON, make at least one challenge that pushes comfort zone

CHALLENGE TYPES TO VARY ACROSS:
- Physical action (do X for Y minutes)
- Reflection exercise (journal about X, analyze Y)
- Skill practice (practice Z technique 3 times)
- Social challenge (reach out to 1 person, share X)
- Habit building (implement small routine change)
- Research task (learn about X, find 3 resources on Y)

BAD EXAMPLE (too vague): "Work on improving your fitness"
GOOD EXAMPLE: "Complete a 20-minute walk in your neighborhood before 9am. Notice 3 things you've never seen before."

Return a JSON object with:
{
  "challenges": [
    {
      "title": "Short, action-oriented title (max 60 chars)",
      "description": "2-3 sentences explaining the challenge and why it matters",
      "instructions": "Step-by-step guide to complete the challenge",
      "difficulty": 5,
      "isRealityShift": false,
      "estimatedDuration": 30,
      "successCriteria": "Clear definition of what done looks like"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a challenge generator specialized in creating actionable, specific personal development challenges. You NEVER create vague challenges that just restate goals. You create DIVERSE challenges that vary in type and approach. Output JSON only.' },
            { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content received from AI');

    const data = JSON.parse(content);
    const challenges = data.challenges || [data]; // Handle both array and single object

    return challenges.map((c: any) => ({
        title: c.title,
        description: c.description,
        instructions: c.instructions || "Follow the description", // fallback
        successCriteria: c.successCriteria || "Complete the task", // fallback
        personalizationNotes: c.personalizationNotes, // This field might be undefined if AI doesn't provide it
        difficulty: c.difficulty || 5,
        isRealityShift: c.isRealityShift || false
    } as Partial<Challenge>));
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
