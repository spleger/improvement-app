'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';
// Import PillarCard components for 4-quadrant pillar layout with sparklines
// PillarCard: Individual card component with icon, stats, and mini sparkline chart
// PillarGrid: Grid wrapper that renders 4 PillarCard components (Soul, Mind, Body, Goals)
import { PillarCard, PillarGrid, type PillarData } from './PillarCard';

// Re-export PillarCard types for potential external use
export type { PillarData };

// Goal color palette for visual distinction
const GOAL_COLORS = [
    { bg: 'var(--gradient-primary)', border: 'var(--color-accent)' },
    { bg: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', border: '#8b5cf6' },
    { bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', border: '#f59e0b' },
    { bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', border: '#ec4899' },
    { bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', border: '#10b981' },
];

// Calendar grid constants for fixed dimensions
const CALENDAR_CELL_SIZE = 40; // Fixed cell size in pixels
const CALENDAR_GAP = 6; // Gap between cells
const CALENDAR_MIN_HEIGHT = 280; // Minimum height for calendar section to prevent layout shift

interface Challenge {
    id: string;
    status: string;
    scheduledDate: string;
    goalId?: string | null;
    goalTitle?: string | null;
}

interface Survey {
    id: string;
    surveyDate: string;
    overallMood: number;
    energyLevel: number;
    motivationLevel: number;
}

interface Goal {
    id: string;
    title: string;
    startedAt: string;
    status: string;
}

interface ProgressData {
    challenges: Challenge[];
    surveys: Survey[];
    activeGoal: Goal | null;
    allGoals: Goal[];
    streak: number;
}

export default function ProgressPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<ProgressData | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/progress');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                // Error fetching progress data - show empty state
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Extract data or use defaults during loading
    const challenges = data?.challenges || [];
    const surveys = data?.surveys || [];
    const activeGoal = data?.activeGoal || null;
    const allGoals = data?.allGoals || [];
    const streak = data?.streak || 0;

    // Create a map of goalId to color index for consistent coloring
    const goalColorMap = new Map<string | null, number>();
    allGoals.forEach((goal, index) => {
        goalColorMap.set(goal.id, index % GOAL_COLORS.length);
    });
    // Add null goalId for challenges without a goal
    goalColorMap.set(null, -1);

    const completedChallenges = challenges.filter(c => c.status === 'completed');
    const skippedChallenges = challenges.filter(c => c.status === 'skipped');

    // Calculate stats per goal
    const goalStats = new Map<string | null, { completed: number; skipped: number; total: number; title: string }>();
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

    // Calculate overall stats
    const completedCount = completedChallenges.length;
    const skippedCount = skippedChallenges.length;
    const totalCount = challenges.length;

    // Build calendar data for last 30 days with proper weekday alignment and goal info
    const calendarData: {
        date: string;
        dayOfMonth: number;
        status: 'completed' | 'skipped' | 'pending' | 'none';
        isEmpty?: boolean;
        goalId?: string | null;
        goalTitle?: string | null;
        monthLabel?: string | null;
    }[] = [];

    // Start date (30 days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);

    // Get the day of week for start date (0=Sunday, 1=Monday, etc.)
    // Convert to Monday-first: Mon=0, Tue=1, ..., Sun=6
    const startDayOfWeek = (startDate.getDay() + 6) % 7;

    // Add empty cells before the first date to align with correct weekday
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarData.push({
            date: '',
            dayOfMonth: 0,
            status: 'none',
            isEmpty: true,
            monthLabel: null
        });
    }

    // Track previous month to detect month changes
    let prevMonth: number | null = null;

    // Add the 30 days of data
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayChallenge = challenges.find(c =>
            new Date(c.scheduledDate).toISOString().split('T')[0] === dateStr
        );

        // Check if month changed - show label on first day of month or first cell of new month
        const currentMonth = date.getMonth();
        const showMonthLabel = prevMonth === null || currentMonth !== prevMonth;
        const monthLabel = showMonthLabel
            ? date.toLocaleDateString('en-US', { month: 'short' })
            : null;
        prevMonth = currentMonth;

        calendarData.push({
            date: dateStr,
            dayOfMonth: date.getDate(),
            status: (dayChallenge?.status as any) || 'none',
            isEmpty: false,
            goalId: dayChallenge?.goalId || null,
            goalTitle: dayChallenge?.goalTitle || null,
            monthLabel
        });
    }

    // Get month labels for the date range
    const firstDate = new Date();
    firstDate.setDate(firstDate.getDate() - 29);
    const lastDate = new Date();
    const monthRange = firstDate.getMonth() === lastDate.getMonth()
        ? lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : `${firstDate.toLocaleDateString('en-US', { month: 'short' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

    // Chart data (mood over time)
    const chartData = surveys.map(s => ({
        date: new Date(s.surveyDate).toISOString().split('T')[0],
        mood: s.overallMood,
        energy: s.energyLevel,
        motivation: s.motivationLevel
    }));

    // Calculate day in journey
    const dayInJourney = activeGoal
        ? Math.min(30, Math.ceil((Date.now() - new Date(activeGoal.startedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    const stats = {
        completed: completedCount,
        skipped: skippedCount,
        total: totalCount,
        streak,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    };

    // Calculate pillar data from surveys (latest 7 days average)
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

    // Build sparkline data from surveys for each pillar (latest 14 days for trend visibility)
    const sparklineSurveys = surveys.slice(0, 14).reverse(); // Reverse for chronological order
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

    // Calculate goals sparkline from daily completion rates over last 14 days
    const goalsSparkline: Array<{ value: number; date?: string }> = [];
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Count challenges completed up to this date
        const challengesUpToDate = challenges.filter(c => {
            const challengeDate = new Date(c.scheduledDate).toISOString().split('T')[0];
            return challengeDate <= dateStr;
        });
        const completedUpToDate = challengesUpToDate.filter(c => c.status === 'completed').length;
        const totalUpToDate = challengesUpToDate.length;

        // Scale to 0-10 for consistency with other pillars
        const rate = totalUpToDate > 0 ? Math.round((completedUpToDate / totalUpToDate) * 10) : 0;
        goalsSparkline.push({ value: rate, date: dateStr });
    }

    // Build pillar data for the 4-quadrant layout with sparklines
    const pillarData: PillarData[] = [
        {
            id: 'soul',
            icon: '💜',
            title: 'Soul',
            value: avgMood > 0 ? avgMood : '—',
            label: 'Mood Score',
            sublabel: recentSurveys.length > 0 ? `${recentSurveys.length}-day avg` : 'No data yet',
            sparklineData: moodSparkline,
            sparklineColor: '#a855f7'
        },
        {
            id: 'mind',
            icon: '🧠',
            title: 'Mind',
            value: avgMotivation > 0 ? avgMotivation : '—',
            label: 'Motivation',
            sublabel: recentSurveys.length > 0 ? `${recentSurveys.length}-day avg` : 'No data yet',
            sparklineData: motivationSparkline,
            sparklineColor: '#0d9488'
        },
        {
            id: 'body',
            icon: '💪',
            title: 'Body',
            value: avgEnergy > 0 ? avgEnergy : '—',
            label: 'Energy Level',
            sublabel: recentSurveys.length > 0 ? `${recentSurveys.length}-day avg` : 'No data yet',
            sparklineData: energySparkline,
            sparklineColor: '#10b981'
        },
        {
            id: 'goals',
            icon: '🎯',
            title: 'Goals',
            value: stats.completionRate > 0 ? `${stats.completionRate}%` : '—',
            label: 'Completion Rate',
            sublabel: totalCount > 0 ? `${completedCount}/${totalCount} challenges` : 'No challenges yet',
            sparklineData: goalsSparkline,
            sparklineColor: '#f59e0b'
        }
    ];

    return (
        <div className="page animate-fade-in">
            {/* Header */}
            <PageHeader
                icon="📊"
                title="Your Progress"
                subtitle={activeGoal ? `Day ${dayInJourney} of your ${activeGoal.title} journey` : 'Track your transformation'}
            />

            {/* Pillars of Health - 4-Quadrant Layout with Sparklines */}
            <section className="pillar-section" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h2 className="heading-4 mb-md">Pillars of Health</h2>
                <PillarGrid pillars={pillarData} />
            </section>

            {/* Section Separator */}
            <hr className="section-separator-gradient" />

            {/* Stats Overview */}
            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h2 className="heading-4 mb-md">Overview</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value fire">{stats.streak}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.completionRate}%</div>
                        <div className="stat-label">Success Rate</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.skipped}</div>
                        <div className="stat-label">Skipped</div>
                    </div>
                </div>
            </section>

            {/* Section Separator */}
            <hr className="section-separator-gradient" />

            {/* Calendar View */}
            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-between mb-md">
                    <h2 className="heading-4">Last 30 Days</h2>
                    <span className="text-tiny text-muted">{monthRange}</span>
                </div>
                <div
                    className={`card ${isLoading ? 'loading-breathe' : ''}`}
                    style={{
                        minHeight: `${CALENDAR_MIN_HEIGHT}px`,
                        boxShadow: 'var(--shadow-md)',
                        border: '1px solid var(--color-border)'
                    }}
                >
                    {isLoading ? (
                        /* Calendar Skeleton Loading State */
                        <div style={{ minHeight: `${CALENDAR_MIN_HEIGHT - 40}px` }}>
                            {/* Weekday headers skeleton */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: `${CALENDAR_GAP}px`,
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                    <div
                                        key={i}
                                        className="skeleton-breathe"
                                        style={{
                                            height: '16px',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    />
                                ))}
                            </div>
                            {/* Calendar cells skeleton - 6 rows for calendar grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: `${CALENDAR_GAP}px`
                            }}>
                                {Array.from({ length: 42 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="skeleton-breathe"
                                        style={{
                                            width: '100%',
                                            height: `${CALENDAR_CELL_SIZE}px`,
                                            minHeight: `${CALENDAR_CELL_SIZE}px`,
                                            borderRadius: '6px'
                                        }}
                                    />
                                ))}
                            </div>
                            {/* Legend skeleton */}
                            <div className="flex flex-wrap justify-center gap-md mt-md">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                        key={i}
                                        className="skeleton-breathe"
                                        style={{
                                            width: '80px',
                                            height: '16px',
                                            borderRadius: 'var(--radius-full)'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Actual Calendar Content */
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(7, minmax(${CALENDAR_CELL_SIZE}px, 1fr))`,
                                gap: `${CALENDAR_GAP}px`,
                                minHeight: `${CALENDAR_MIN_HEIGHT - 100}px`
                            }}>
                                {/* Weekday headers */}
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                    <div key={i} className="text-tiny text-muted text-center" style={{
                                        padding: '4px',
                                        fontWeight: 500,
                                        height: '24px'
                                    }}>
                                        {day}
                                    </div>
                                ))}
                                {/* Calendar cells */}
                                {calendarData.map((day, i) => {
                                    const goalColorIndex = day.goalId ? goalColorMap.get(day.goalId) ?? 0 : -1;
                                    const goalColor = goalColorIndex >= 0 ? GOAL_COLORS[goalColorIndex] : null;

                                    // Determine background based on status and goal
                                    const getBackground = () => {
                                        if (day.status === 'completed' && goalColor) {
                                            return goalColor.bg;
                                        }
                                        if (day.status === 'completed') {
                                            return 'var(--gradient-success)';
                                        }
                                        if (day.status === 'skipped') {
                                            return 'var(--color-error)';
                                        }
                                        if (day.status === 'pending') {
                                            return 'var(--color-warning)';
                                        }
                                        return 'var(--color-surface)';
                                    };

                                    const isToday = day.date === new Date().toISOString().split('T')[0];
                                    const hasActivity = ['completed', 'skipped', 'pending'].includes(day.status);

                                    return (
                                        <div
                                            key={i}
                                            className={`calendar-cell ${hasActivity ? 'calendar-cell-active' : ''} ${isToday ? 'calendar-cell-today' : ''}`}
                                            style={{
                                                width: '100%',
                                                height: `${CALENDAR_CELL_SIZE}px`,
                                                minHeight: `${CALENDAR_CELL_SIZE}px`,
                                                borderRadius: '6px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                gap: '2px',
                                                visibility: day.isEmpty ? 'hidden' : 'visible',
                                                background: getBackground(),
                                                color: ['completed', 'skipped'].includes(day.status) ? 'white' : 'var(--color-text-muted)',
                                                border: isToday
                                                    ? '2px solid var(--color-accent)'
                                                    : 'none',
                                                position: 'relative',
                                                cursor: hasActivity ? 'pointer' : 'default'
                                            }}
                                            title={day.date ? `${day.date}: ${day.status}${day.goalTitle ? ` (${day.goalTitle})` : ''}` : ''}
                                        >
                                            {/* Month indicator label */}
                                            {day.monthLabel && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '1px',
                                                    left: '2px',
                                                    fontSize: '0.5rem',
                                                    fontWeight: 600,
                                                    lineHeight: 1,
                                                    color: ['completed', 'skipped'].includes(day.status) ? 'rgba(255,255,255,0.9)' : 'var(--color-accent)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.02em'
                                                }}>
                                                    {day.monthLabel}
                                                </span>
                                            )}
                                            {/* Goal indicator dot */}
                                            {day.goalId && day.status !== 'none' && goalColor && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '2px',
                                                    right: '2px',
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(255,255,255,0.8)',
                                                    border: `1px solid ${goalColor.border}`
                                                }} />
                                            )}
                                            {/* Date label */}
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                lineHeight: 1,
                                                marginTop: day.monthLabel ? '6px' : '0'
                                            }}>
                                                {day.dayOfMonth || ''}
                                            </span>
                                            {/* Status icon */}
                                            <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>
                                                {day.status === 'completed' && '✓'}
                                                {day.status === 'skipped' && '✗'}
                                                {day.status === 'pending' && '○'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Status Legend */}
                            <div className="flex flex-wrap justify-center gap-md mt-md text-tiny">
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--gradient-success)' }} />
                                    Completed
                                </span>
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-error)' }} />
                                    Skipped
                                </span>
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-warning)' }} />
                                    Pending
                                </span>
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-surface)' }} />
                                    No challenge
                                </span>
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid var(--color-accent)' }} />
                                    Today
                                </span>
                            </div>

                            {/* Goal Colors Legend (only if multiple goals) */}
                            {allGoals.length > 1 && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                                    <div className="text-tiny text-muted text-center mb-sm">Goal Colors</div>
                                    <div className="flex flex-wrap justify-center gap-md text-tiny">
                                        {allGoals.map((goal, index) => {
                                            const colorIndex = index % GOAL_COLORS.length;
                                            const color = GOAL_COLORS[colorIndex];
                                            return (
                                                <span key={goal.id} className="flex items-center gap-sm">
                                                    <span style={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: 3,
                                                        background: color.bg
                                                    }} />
                                                    <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {goal.title}
                                                    </span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Goal-Specific Progress (only if multiple goals with data) */}
            {goalStats.size > 1 && (
                <>
                    {/* Section Separator */}
                    <hr className="section-separator-gradient" />

                    <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                        <h2 className="heading-4 mb-md">Progress by Goal</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Array.from(goalStats.entries()).map(([goalId, stats]) => {
                                const colorIndex = goalId ? goalColorMap.get(goalId) ?? 0 : -1;
                                const color = colorIndex >= 0 ? GOAL_COLORS[colorIndex] : null;
                                const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

                                // Get gradient background style for goal card
                                const goalCardBg = color
                                    ? `linear-gradient(135deg, ${color.border}15 0%, transparent 60%)`
                                    : 'var(--color-surface)';

                                return (
                                    <div
                                        key={goalId || 'no-goal'}
                                        className="card"
                                        style={{
                                            padding: '12px 16px',
                                            borderLeft: color ? `4px solid ${color.border}` : '4px solid var(--color-text-muted)',
                                            background: goalCardBg,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-sm">
                                            <span className="text-sm font-medium" style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {stats.title}
                                            </span>
                                            <span className="text-sm" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                                                {completionRate}% complete
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            gap: '4px',
                                            height: '6px',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                            background: 'var(--color-surface)'
                                        }}>
                                            {stats.completed > 0 && (
                                                <div style={{
                                                    width: `${(stats.completed / stats.total) * 100}%`,
                                                    background: color ? color.bg : 'var(--gradient-success)',
                                                    borderRadius: '3px 0 0 3px'
                                                }} />
                                            )}
                                            {stats.skipped > 0 && (
                                                <div style={{
                                                    width: `${(stats.skipped / stats.total) * 100}%`,
                                                    background: 'var(--color-error)'
                                                }} />
                                            )}
                                        </div>
                                        <div className="flex gap-md mt-sm text-tiny text-muted">
                                            <span>✓ {stats.completed}</span>
                                            <span>✗ {stats.skipped}</span>
                                            <span>Total: {stats.total}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            {/* Mood Chart (Simplified) */}
            {chartData.length > 0 && (
                <>
                    {/* Section Separator */}
                    <hr className="section-separator-gradient" />

                    <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                        <h2 className="heading-4 mb-md">Mood & Energy Trends</h2>
                        <div className="card">
                            <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                {chartData.slice(-14).map((point, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100%' }}>
                                        {/* Mood bar */}
                                        <div
                                            style={{
                                                flex: 1,
                                                height: `${point.mood * 10}%`,
                                                background: 'var(--gradient-primary)',
                                                borderRadius: '2px 2px 0 0',
                                                minHeight: '4px'
                                            }}
                                            title={`Mood: ${point.mood}`}
                                        />
                                        {/* Energy bar */}
                                        <div
                                            style={{
                                                flex: 1,
                                                height: `${point.energy * 10}%`,
                                                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                                                borderRadius: '2px 2px 0 0',
                                                minHeight: '4px'
                                            }}
                                            title={`Energy: ${point.energy}`}
                                        />
                                        {/* Motivation bar */}
                                        <div
                                            style={{
                                                flex: 1,
                                                height: `${point.motivation * 10}%`,
                                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                                borderRadius: '2px 2px 0 0',
                                                minHeight: '4px'
                                            }}
                                            title={`Motivation: ${point.motivation}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-md mt-md text-tiny">
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--gradient-primary)' }} />
                                    Mood
                                </span>
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }} />
                                    Energy
                                </span>
                                <span className="flex items-center gap-sm">
                                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }} />
                                    Motivation
                                </span>
                            </div>
                            <div className="text-tiny text-muted text-center mt-sm">
                                Last {Math.min(14, chartData.length)} days • Levels (1-10)
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* Section Separator */}
            <hr className="section-separator-subtle" />

            {/* Quick Actions */}
            <section style={{ marginTop: 'var(--spacing-xl)' }}>
                <div className="flex gap-md">
                    <Link href="/survey" className="btn btn-primary" style={{ flex: 1 }}>
                        📝 Daily Check-in
                    </Link>
                    <Link href="/" className="btn btn-secondary" style={{ flex: 1 }}>
                        🏠 Home
                    </Link>
                </div>
            </section>

            {/* Bottom Navigation */}

            {/* Calendar Cell Hover Styles */}
            <style jsx>{`
                .calendar-cell {
                    transition: transform var(--transition-fast),
                                box-shadow var(--transition-fast),
                                filter var(--transition-fast),
                                opacity var(--transition-fast);
                }
                .calendar-cell:hover {
                    transform: scale(1.08);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10;
                }
                .calendar-cell-active:hover {
                    transform: scale(1.12);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    filter: brightness(1.1);
                }
                .calendar-cell-today {
                    box-shadow: 0 0 0 2px var(--color-accent), 0 2px 8px rgba(13, 148, 136, 0.3);
                }
                .calendar-cell-today:hover {
                    box-shadow: 0 0 0 2px var(--color-accent), 0 6px 16px rgba(13, 148, 136, 0.4);
                }
            `}</style>
        </div>
    );
}
