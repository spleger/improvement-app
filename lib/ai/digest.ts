import { getAnthropicClient, ANTHROPIC_MODEL } from '@/lib/anthropic';
import { logApiUsage } from '@/lib/ai/costs';

export interface DigestData {
    challengesCompleted: number;
    challengesSkipped: number;
    avgDifficulty: number | null;
    avgSatisfaction: number | null;
    avgMood: number | null;
    avgEnergy: number | null;
    avgMotivation: number | null;
    moodTrend: 'improving' | 'declining' | 'stable';
    diaryCount: number;
    commonThemes: string[];
    habitCompletionRate: number;
    bestHabit: string | null;
    worstHabit: string | null;
    activeGoalTitles: string[];
    streak: number;
}

export interface DigestResult {
    aiSummary: string;
    topAchievement: string;
    focusArea: string;
    suggestion: string;
}

export async function generateWeeklyDigest(
    userId: string,
    data: DigestData,
): Promise<DigestResult> {
    const anthropic = getAnthropicClient();

    const prompt = `You are a personal development coach reviewing a user's weekly progress. Generate a brief, encouraging weekly digest. Do NOT use emojis anywhere in your response. ASCII characters only.

WEEKLY DATA:
- Challenges completed: ${data.challengesCompleted} (skipped: ${data.challengesSkipped})
- Average difficulty felt: ${data.avgDifficulty ?? 'N/A'}/10
- Average satisfaction: ${data.avgSatisfaction ?? 'N/A'}/10
- Average mood: ${data.avgMood ?? 'N/A'}/10 (trend: ${data.moodTrend})
- Average energy: ${data.avgEnergy ?? 'N/A'}/10
- Average motivation: ${data.avgMotivation ?? 'N/A'}/10
- Diary entries: ${data.diaryCount}
- Common themes: ${data.commonThemes.join(', ') || 'none'}
- Habit completion rate: ${data.habitCompletionRate}%
- Best habit: ${data.bestHabit || 'N/A'}
- Needs attention: ${data.worstHabit || 'N/A'}
- Active goals: ${data.activeGoalTitles.join(', ') || 'none'}
- Current streak: ${data.streak} days

Respond in JSON format with no markdown code fences:
{
  "aiSummary": "3-5 sentence progress summary - warm, specific, referencing actual numbers",
  "topAchievement": "Single sentence highlighting the biggest win this week",
  "focusArea": "Single sentence identifying area needing most attention",
  "suggestion": "Single actionable suggestion for next week"
}`;

    const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
    });

    // Log cost
    logApiUsage({
        userId,
        route: 'digest/weekly',
        provider: 'anthropic',
        model: ANTHROPIC_MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
        // Extract JSON from response (may be wrapped in markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch {
        // Fall through to default
    }

    return {
        aiSummary: text || 'No summary generated.',
        topAchievement: '',
        focusArea: '',
        suggestion: '',
    };
}
