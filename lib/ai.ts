import OpenAI from 'openai';
import { Goal, Challenge, UserPrefs, Message, ShiftSuggestion, GeneratedChallenge } from './types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key', // Fallback for build time/test without env
    dangerouslyAllowBrowser: true, // In case this runs client side, but it should be server
});

export const SYSTEM_PROMPTS = {
    TOUGH_LOVE: "You are a drill sergeant. No excuses. Push the user beyond their limits.",
    SCIENTIFIC: "Cite studies. Be analytical. Focus on transformation through neuroplasticity and behavioral science.",
    EMPATHETIC: "Be understanding and supportive. Focus on emotional well-being and steady progress."
};

export async function generateChallenge(userPrefs: UserPrefs, goal: Goal, recentChallenges: Challenge[] = [], focusArea?: string): Promise<GeneratedChallenge> {
    const historyText = recentChallenges.length > 0
        ? recentChallenges.map(c => `- ${c.title} (Difficulty: ${c.difficulty}, Type: ${c.personalizationNotes || 'general'})`).join('\n')
        : 'No recent history.';

    const focusAreaInstructions = focusArea
        ? `Focus Area: The user specifically wants to work on "${focusArea}". Design the challenge around this focus while still being specific and actionable.`
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

RECENT COMPLETED CHALLENGES (avoid repeating these types/approaches):
${historyText}

===== CRITICAL RULES =====
1. NEVER just rephrase the goal as "start doing X" or "work on Y" - that's lazy and unhelpful
2. Create a SPECIFIC, MEASURABLE action with concrete steps, numbers, or timeframes
3. The challenge must be completable in ONE day or session (not an ongoing habit)
4. Make it progressively build toward the goal (not just reword the goal)
5. If Reality Shift is ON, make it slightly uncomfortable but achievable

===== DIVERSITY REQUIREMENTS =====
Select ONE challenge type from these categories. If recent history shows a type was used, pick a DIFFERENT one:
- PHYSICAL: Do X activity for Y minutes (e.g., walk, stretch, exercise)
- REFLECTION: Journal/analyze specific topic with guided prompts
- SKILL: Practice a specific technique N times with measurable criteria
- SOCIAL: Reach out to N people, have specific conversation
- HABIT: Implement one small environmental or routine change
- RESEARCH: Find N resources, summarize key insights

===== BAD vs GOOD EXAMPLES =====

BAD (too vague, just restates goal):
- "Work on improving your fitness"
- "Practice being more confident"
- "Start learning Spanish"
- "Be more productive today"

GOOD (specific, actionable, measurable):
- "Complete a 20-minute walk in your neighborhood before 9am. Notice 3 things you've never seen before."
- "Record yourself giving a 2-minute self-introduction, watch it back, and note 2 things you did well and 1 to improve."
- "Learn 10 Spanish food vocabulary words using Duolingo, then write a pretend restaurant order using all 10."
- "Use the Pomodoro technique (25min work, 5min break) for 3 cycles on your most important task. Track what you completed."

===== REQUIRED OUTPUT FORMAT =====
Return a JSON object with these EXACT fields:

{
  "title": "Short, action-oriented title (max 60 chars, starts with verb)",
  "description": "2-3 sentences explaining WHAT to do and WHY it matters for the goal",
  "instructions": "Step-by-step numbered guide (1. First step\\n2. Second step\\n3. Third step)",
  "successCriteria": "Specific, measurable definition of what 'done' looks like (e.g., 'Completed 3 cycles and logged at least 2 tasks finished')",
  "tips": ["Tip 1 specific to this challenge", "Tip 2 specific to this challenge", "Tip 3 specific to this challenge"],
  "difficulty": 5,
  "isRealityShift": false,
  "estimatedDuration": 30,
  "challengeType": "physical|reflection|skill|social|habit|research"
}

IMPORTANT:
- "instructions" and "successCriteria" must be DIFFERENT - instructions tell HOW, criteria tell WHAT DONE LOOKS LIKE
- "tips" must be specific to THIS challenge, not generic advice like "stay focused" or "be consistent"
`;

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a challenge generator specialized in creating actionable, specific personal development challenges. You NEVER create vague challenges that just restate goals. You always include specific tips tailored to the exact challenge. Output JSON only.' },
            { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content received from AI');

    const data = JSON.parse(content);

    // Parse tips - handle both array and string formats
    let tips: string | null = null;
    if (data.tips) {
        tips = Array.isArray(data.tips) ? JSON.stringify(data.tips) : data.tips;
    }

    return {
        title: data.title,
        description: data.description,
        instructions: data.instructions || null,
        successCriteria: data.successCriteria || null,
        tips: tips,
        personalizationNotes: data.challengeType || null,
        difficulty: data.difficulty || userPrefs.preferredDifficulty,
        isRealityShift: data.isRealityShift || false,
    };
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
): Promise<GeneratedChallenge[]> {
    const clampedCount = Math.min(Math.max(count, 1), 5);

    const historyText = recentChallenges.length > 0
        ? recentChallenges.map(c => `- ${c.title} (Difficulty: ${c.difficulty}, Type: ${c.personalizationNotes || 'general'})`).join('\n')
        : 'No recent history.';

    const focusAreaInstructions = focusArea
        ? `Focus Area: The user specifically wants to work on "${focusArea}". Design challenges around this focus while still being specific and actionable.`
        : '';

    // Determine which challenge types to require based on count
    const allChallengeTypes = ['physical', 'reflection', 'skill', 'social', 'habit', 'research'];
    const requiredTypes = allChallengeTypes.slice(0, clampedCount);

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

RECENT COMPLETED CHALLENGES (avoid repeating these types/approaches):
${historyText}

===== CRITICAL RULES =====
1. NEVER just rephrase the goal as "start doing X" or "work on Y" - that's lazy and unhelpful
2. Create ${clampedCount} SPECIFIC, MEASURABLE challenges with concrete steps, numbers, or timeframes
3. Each challenge must be completable in ONE day or session (not ongoing habits)
4. Make them progressively build toward the goal (not just reword the goal)
5. If Reality Shift is ON, at least one challenge should push the comfort zone
6. Each challenge MUST include 3 tips specific to THAT challenge

===== MANDATORY TYPE DIVERSITY =====
You MUST use ${clampedCount} DIFFERENT challenge types from this list. Each challenge must have a unique challengeType:
- physical: Do X activity for Y minutes (e.g., walk, stretch, exercise)
- reflection: Journal/analyze specific topic with guided prompts
- skill: Practice a specific technique N times with measurable criteria
- social: Reach out to N people, have specific conversation
- habit: Implement one small environmental or routine change
- research: Find N resources, summarize key insights

REQUIRED: Use these types: ${requiredTypes.join(', ')} (one challenge per type)

===== BAD vs GOOD EXAMPLES =====

BAD (too vague, just restates goal):
- "Work on improving your fitness"
- "Practice being more confident"
- "Start learning Spanish"
- "Be more productive today"

GOOD (specific, actionable, measurable):
- "Complete a 20-minute walk in your neighborhood before 9am. Notice 3 things you've never seen before."
- "Record yourself giving a 2-minute self-introduction, watch it back, and note 2 things you did well and 1 to improve."
- "Learn 10 Spanish food vocabulary words using Duolingo, then write a pretend restaurant order using all 10."
- "Use the Pomodoro technique (25min work, 5min break) for 3 cycles on your most important task. Track what you completed."

===== REQUIRED OUTPUT FORMAT =====
Return a JSON object with EXACTLY ${clampedCount} challenges, each with these fields:

{
  "challenges": [
    {
      "title": "Short, action-oriented title (max 60 chars, starts with verb)",
      "description": "2-3 sentences explaining WHAT to do and WHY it matters for the goal",
      "instructions": "Step-by-step numbered guide (1. First step\\n2. Second step\\n3. Third step)",
      "successCriteria": "Specific, measurable definition of what 'done' looks like",
      "tips": ["Tip 1 specific to this challenge", "Tip 2 specific to this challenge", "Tip 3 specific to this challenge"],
      "difficulty": 5,
      "isRealityShift": false,
      "estimatedDuration": 30,
      "challengeType": "physical|reflection|skill|social|habit|research"
    }
  ]
}

IMPORTANT:
- "instructions" and "successCriteria" must be DIFFERENT - instructions tell HOW, criteria tell WHAT DONE LOOKS LIKE
- "tips" must be specific to THIS challenge, not generic advice like "stay focused" or "be consistent"
- Each challenge MUST have a DIFFERENT challengeType - no duplicates allowed
- Progress difficulty slightly (easiest challenge first, hardest last)
`;

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: 'You are a challenge generator specialized in creating actionable, specific personal development challenges. You NEVER create vague challenges that just restate goals. You create DIVERSE challenges with different types and always include specific tips tailored to each exact challenge. Output JSON only.' },
            { role: 'user', content: prompt }
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content received from AI');

    const data = JSON.parse(content);
    const challenges = data.challenges || [data]; // Handle both array and single object

    return challenges.map((c: any): GeneratedChallenge => {
        // Parse tips - handle both array and string formats
        let tips: string | null = null;
        if (c.tips) {
            tips = Array.isArray(c.tips) ? JSON.stringify(c.tips) : c.tips;
        }

        return {
            title: c.title,
            description: c.description,
            instructions: c.instructions || null,
            successCriteria: c.successCriteria || null,
            tips: tips,
            personalizationNotes: c.challengeType || null,
            difficulty: c.difficulty || userPrefs.preferredDifficulty,
            isRealityShift: c.isRealityShift || false,
        };
    });
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
