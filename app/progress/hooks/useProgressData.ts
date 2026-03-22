'use client';

import { useState, useEffect } from 'react';

const GOAL_COLORS = [
    { bg: 'var(--gradient-primary)', border: 'var(--color-accent)' },
    { bg: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', border: '#8b5cf6' },
    { bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', border: '#f59e0b' },
    { bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', border: '#ec4899' },
    { bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', border: '#10b981' },
];

export interface Challenge {
    id: string;
    status: string;
    scheduledDate: string;
    goalId?: string | null;
    goalTitle?: string | null;
}

export interface Survey {
    id: string;
    surveyDate: string;
    overallMood: number;
    energyLevel: number;
    motivationLevel: number;
}

export interface Goal {
    id: string;
    title: string;
    startedAt: string;
    status: string;
}

export interface ProgressData {
    challenges: Challenge[];
    surveys: Survey[];
    activeGoal: Goal | null;
    allGoals: Goal[];
    streak: number;
}

export interface CalendarDay {
    date: string;
    dayOfMonth: number;
    status: 'completed' | 'skipped' | 'pending' | 'none';
    isEmpty?: boolean;
    goalId?: string | null;
    goalTitle?: string | null;
    monthLabel?: string | null;
}

export interface GoalStatEntry {
    completed: number;
    skipped: number;
    total: number;
    title: string;
}

export interface ProgressStats {
    completed: number;
    skipped: number;
    total: number;
    streak: number;
    completionRate: number;
}

export interface ChartDataPoint {
    date: string;
    mood: number;
    energy: number;
    motivation: number;
}

export { GOAL_COLORS };

const CALENDAR_MIN_HEIGHT = 280;
export { CALENDAR_MIN_HEIGHT };

export function useProgressData() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<ProgressData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | 'all'>('all');
    const [selectedMetric, setSelectedMetric] = useState<'mood' | 'energy' | 'motivation'>('mood');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/progress');
                if (!res.ok) {
                    setError('Failed to load progress data. Please try again.');
                    return;
                }
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                    if (result.data.activeGoal) {
                        setSelectedGoalId(result.data.activeGoal.id);
                    } else if (result.data.allGoals && result.data.allGoals.length > 0) {
                        const firstActive = result.data.allGoals.find((g: Goal) => g.status === 'active');
                        if (firstActive) setSelectedGoalId(firstActive.id);
                        else setSelectedGoalId(result.data.allGoals[0].id);
                    }
                } else {
                    setError(result.error || 'Failed to load progress data.');
                }
            } catch {
                setError('Network error. Please check your connection.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const challenges = data?.challenges || [];
    const surveys = data?.surveys || [];
    const activeGoal = data?.activeGoal || null;
    const allGoals = data?.allGoals || [];
    const streak = data?.streak || 0;

    const goalColorMap = new Map<string | null, number>();
    allGoals.forEach((goal, index) => {
        goalColorMap.set(goal.id, index % GOAL_COLORS.length);
    });
    goalColorMap.set(null, -1);

    const completedChallenges = challenges.filter(c => c.status === 'completed');
    const skippedChallenges = challenges.filter(c => c.status === 'skipped');

    const goalStats = new Map<string | null, GoalStatEntry>();
    challenges.forEach(c => {
        const key = c.goalId || null;
        if (!goalStats.has(key)) {
            goalStats.set(key, { completed: 0, skipped: 0, total: 0, title: c.goalTitle || 'No Goal' });
        }
        const stats = goalStats.get(key)!;
        stats.total++;
        if (c.status === 'completed') stats.completed++;
        if (c.status === 'skipped') stats.skipped++;
    });

    const completedCount = completedChallenges.length;
    const skippedCount = skippedChallenges.length;
    const totalCount = challenges.length;

    const calendarData: CalendarDay[] = [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);

    const startDayOfWeek = (startDate.getDay() + 6) % 7;

    for (let i = 0; i < startDayOfWeek; i++) {
        calendarData.push({
            date: '',
            dayOfMonth: 0,
            status: 'none',
            isEmpty: true,
            monthLabel: null
        });
    }

    let prevMonth: number | null = null;

    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        let dayChallenge: Challenge | undefined;

        if (selectedGoalId === 'all') {
            const dayChallenges = challenges.filter(c =>
                new Date(c.scheduledDate).toISOString().split('T')[0] === dateStr
            );

            dayChallenge = dayChallenges.sort((a, b) => {
                const statusPriority = { completed: 3, skipped: 2, pending: 1 };
                return (statusPriority[b.status as keyof typeof statusPriority] || 0) - (statusPriority[a.status as keyof typeof statusPriority] || 0);
            })[0];
        } else {
            dayChallenge = challenges.find(c =>
                new Date(c.scheduledDate).toISOString().split('T')[0] === dateStr &&
                c.goalId === selectedGoalId
            );
        }

        const currentMonth = date.getMonth();
        const showMonthLabel = prevMonth === null || currentMonth !== prevMonth;
        const monthLabel = showMonthLabel
            ? date.toLocaleDateString('en-US', { month: 'short' })
            : null;
        prevMonth = currentMonth;

        calendarData.push({
            date: dateStr,
            dayOfMonth: date.getDate(),
            status: (dayChallenge?.status as 'completed' | 'skipped' | 'pending') || 'none',
            isEmpty: false,
            goalId: dayChallenge?.goalId || null,
            goalTitle: dayChallenge?.goalTitle || null,
            monthLabel
        });
    }

    const firstDate = new Date();
    firstDate.setDate(firstDate.getDate() - 29);
    const lastDate = new Date();
    const monthRange = firstDate.getMonth() === lastDate.getMonth()
        ? lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : `${firstDate.toLocaleDateString('en-US', { month: 'short' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

    const chartData: ChartDataPoint[] = surveys.map(s => ({
        date: new Date(s.surveyDate).toISOString().split('T')[0],
        mood: s.overallMood,
        energy: s.energyLevel,
        motivation: s.motivationLevel
    }));

    const displayedGoal = selectedGoalId === 'all' ? activeGoal : allGoals.find(g => g.id === selectedGoalId);

    const dayInJourney = displayedGoal
        ? Math.min(30, Math.ceil((Date.now() - new Date(displayedGoal.startedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    const stats: ProgressStats = {
        completed: completedCount,
        skipped: skippedCount,
        total: totalCount,
        streak,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    };

    const recentSurveys = surveys.slice(0, 7);
    const avgMood = recentSurveys.length > 0
        ? Math.round((recentSurveys.reduce((sum, s) => sum + s.overallMood, 0) / recentSurveys.length) * 10) / 10
        : 0;
    const avgEnergy = recentSurveys.length > 0
        ? Math.round((recentSurveys.reduce((sum, s) => sum + s.energyLevel, 0) / recentSurveys.length) * 10) / 10
        : 0;
    const avgMotivation = recentSurveys.length > 0
        ? Math.round((recentSurveys.reduce((sum, s) => sum + s.motivationLevel, 0) / recentSurveys.length) * 10) / 10
        : 0;

    const sparklineSurveys = surveys.slice(0, 14).reverse();
    const moodSparkline = sparklineSurveys.map(s => ({
        value: s.overallMood,
        date: new Date(s.surveyDate).toISOString().split('T')[0]
    }));
    const motivationSparkline = sparklineSurveys.map(s => ({
        value: s.motivationLevel,
        date: new Date(s.surveyDate).toISOString().split('T')[0]
    }));
    const energySparkline = sparklineSurveys.map(s => ({
        value: s.energyLevel,
        date: new Date(s.surveyDate).toISOString().split('T')[0]
    }));

    const goalsSparkline: Array<{ value: number; date?: string }> = [];
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const challengesUpToDate = challenges.filter(c => {
            const challengeDate = new Date(c.scheduledDate).toISOString().split('T')[0];
            return challengeDate <= dateStr;
        });
        const completedUpToDate = challengesUpToDate.filter(c => c.status === 'completed').length;
        const totalUpToDate = challengesUpToDate.length;

        const rate = totalUpToDate > 0 ? Math.round((completedUpToDate / totalUpToDate) * 10) : 0;
        goalsSparkline.push({ value: rate, date: dateStr });
    }

    const pillarData = [
        {
            id: 'soul' as const,
            icon: '\uD83D\uDC9C',
            title: 'Soul',
            value: avgMood > 0 ? avgMood : '\u2014',
            label: 'Mood Score',
            sublabel: recentSurveys.length > 0 ? `${recentSurveys.length}-day avg` : 'No data yet',
            sparklineData: moodSparkline,
            sparklineColor: '#a855f7'
        },
        {
            id: 'mind' as const,
            icon: '\uD83E\uDDE0',
            title: 'Mind',
            value: avgMotivation > 0 ? avgMotivation : '\u2014',
            label: 'Motivation',
            sublabel: recentSurveys.length > 0 ? `${recentSurveys.length}-day avg` : 'No data yet',
            sparklineData: motivationSparkline,
            sparklineColor: '#0d9488'
        },
        {
            id: 'body' as const,
            icon: '\uD83D\uDCAA',
            title: 'Body',
            value: avgEnergy > 0 ? avgEnergy : '\u2014',
            label: 'Energy Level',
            sublabel: recentSurveys.length > 0 ? `${recentSurveys.length}-day avg` : 'No data yet',
            sparklineData: energySparkline,
            sparklineColor: '#10b981'
        },
        {
            id: 'goals' as const,
            icon: '\uD83C\uDFAF',
            title: 'Goals',
            value: stats.completionRate > 0 ? `${stats.completionRate}%` : '\u2014',
            label: 'Completion Rate',
            sublabel: totalCount > 0 ? `${completedCount}/${totalCount} challenges` : 'No challenges yet',
            sparklineData: goalsSparkline,
            sparklineColor: '#f59e0b'
        }
    ];

    return {
        isLoading,
        error,
        selectedGoalId,
        setSelectedGoalId,
        selectedMetric,
        setSelectedMetric,
        activeGoal,
        allGoals,
        challenges,
        goalColorMap,
        goalStats,
        calendarData,
        monthRange,
        chartData,
        dayInJourney,
        stats,
        pillarData,
    };
}
