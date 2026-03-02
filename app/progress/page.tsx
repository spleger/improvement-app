'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';
// Import PillarCard components for 4-quadrant pillar layout with sparklines
// PillarCard: Individual card component with icon, stats, and mini sparkline chart
// PillarGrid: Grid wrapper that renders 4 PillarCard components (Soul, Mind, Body, Goals)
import { PillarCard, PillarGrid, type PillarData } from './PillarCard';
// Import MoodEnergyChart for displaying mood/energy/motivation trends as a line chart
import { MoodEnergyChart } from '../../components/Charts';

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

// Calendar grid constants
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
    // New state for filters
    const [selectedGoalId, setSelectedGoalId] = useState<string | 'all'>('all');
    const [selectedMetric, setSelectedMetric] = useState<'mood' | 'energy' | 'motivation'>('mood');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/progress');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                    // Default to first active goal if available, otherwise 'all'
                    if (result.data.activeGoal) {
                        setSelectedGoalId(result.data.activeGoal.id);
                    } else if (result.data.allGoals && result.data.allGoals.length > 0) {
                        // Find first active goal in allGoals if the main activeGoal isn't set
                        const firstActive = result.data.allGoals.find((g: Goal) => g.status === 'active');
                        if (firstActive) setSelectedGoalId(firstActive.id);
                        else setSelectedGoalId(result.data.allGoals[0].id);
                    }
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

        // FILTER LOGIC: Find challenge for this day based on selectedGoalId
        let dayChallenge: Challenge | undefined;

        if (selectedGoalId === 'all') {
            // If multiple challenges on same day, prioritize completed > skipped > pending
            const dayChallenges = challenges.filter(c =>
                new Date(c.scheduledDate).toISOString().split('T')[0] === dateStr
            );

            // Sort by status priority
            dayChallenge = dayChallenges.sort((a, b) => {
                const statusPriority = { completed: 3, skipped: 2, pending: 1 };
                return (statusPriority[b.status as keyof typeof statusPriority] || 0) - (statusPriority[a.status as keyof typeof statusPriority] || 0);
            })[0];
        } else {
            // Find specific goal challenge
            dayChallenge = challenges.find(c =>
                new Date(c.scheduledDate).toISOString().split('T')[0] === dateStr &&
                c.goalId === selectedGoalId
            );
        }

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
    const displayedGoal = selectedGoalId === 'all' ? activeGoal : allGoals.find(g => g.id === selectedGoalId);

    const dayInJourney = displayedGoal
        ? Math.min(30, Math.ceil((Date.now() - new Date(displayedGoal.startedAt).getTime()) / (1000 * 60 * 60 * 24)))
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
                <h2 className="heading-4 mb-md" style={{ color: 'var(--color-text-primary)' }}>Pillars of Health</h2>
                <PillarGrid pillars={pillarData} />
            </section>

            {/* Section Separator */}
            <hr className="section-separator-gradient" />

            {/* Stats Overview */}
            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h2 className="heading-4 mb-md" style={{ color: 'var(--color-text-primary)' }}>Overview</h2>
                <div className="stats-grid">
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value fire">{stats.streak}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value stat-value-success">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value stat-value-accent">{stats.completionRate}%</div>
                        <div className="stat-label">Success Rate</div>
                    </div>
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value stat-value-muted">{stats.skipped}</div>
                        <div className="stat-label">Skipped</div>
                    </div>
                </div>
            </section>

            {/* Section Separator */}
            <hr className="section-separator-gradient" />

            {/* Calendar View */}
            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
                    <div className="flex items-center gap-md">
                        <h2 className="heading-4" style={{ color: 'var(--color-text-primary)' }}>Last 30 Days</h2>
                        {/* Goal Selector */}
                        <div className="relative">
                            <select
                                value={selectedGoalId}
                                onChange={(e) => setSelectedGoalId(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    background: 'var(--color-surface-2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-full)',
                                    padding: '6px 32px 6px 16px',
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-primary)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    fontWeight: 500,
                                    maxWidth: '200px',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                <option value="all">All Goals</option>
                                {allGoals.map(goal => (
                                    <option key={goal.id} value={goal.id}>
                                        {goal.title}
                                    </option>
                                ))}
                            </select>
                            {/* Custom arrow icon */}
                            <div style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.7rem'
                            }}>
                                ▼
                            </div>
                        </div>
                    </div>
                    <span className="text-tiny text-muted">{monthRange}</span>
                </div>
                <div
                    className={`card calendar-card ${isLoading ? 'loading-breathe' : ''}`}
                    style={{
                        minHeight: `${CALENDAR_MIN_HEIGHT}px`,
                        boxShadow: 'var(--shadow-md)',
                        border: '1px solid var(--color-border)',
                        transition: 'box-shadow var(--transition-normal), transform var(--transition-normal)'
                    }}
                >
                    {isLoading ? (
                        /* Calendar Skeleton Loading State */
                        <div style={{ minHeight: `${CALENDAR_MIN_HEIGHT - 40}px` }}>
                            {/* Weekday headers skeleton */}
                            <div className="calendar-grid" style={{ marginBottom: 'var(--spacing-sm)' }}>
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
                            <div className="calendar-grid">
                                {Array.from({ length: 42 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="skeleton-breathe"
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            minHeight: '28px',
                                            maxHeight: '44px',
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
                            <div
                                className="calendar-grid"
                                style={{
                                    minHeight: `${CALENDAR_MIN_HEIGHT - 100}px`
                                }}
                            >
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
                                                aspectRatio: '1',
                                                minHeight: '28px',
                                                maxHeight: '44px',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
                                                gap: '1px',
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
                                                    left: '1px',
                                                    fontSize: 'clamp(0.4rem, 1.2vw, 0.5rem)',
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
                                                fontSize: 'clamp(0.55rem, 1.8vw, 0.7rem)',
                                                fontWeight: 600,
                                                lineHeight: 1,
                                                marginTop: day.monthLabel ? '4px' : '0'
                                            }}>
                                                {day.dayOfMonth || ''}
                                            </span>
                                            {/* Status icon */}
                                            <span style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.65rem)', lineHeight: 1 }}>
                                                {day.status === 'completed' && '✓'}
                                                {day.status === 'skipped' && '✗'}
                                                {day.status === 'pending' && '○'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Status Legend */}
                            <div className="flex flex-wrap justify-center gap-md mt-md text-tiny" style={{ paddingTop: 'var(--spacing-sm)' }}>
                                <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--gradient-success)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Completed</span>
                                </span>
                                <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--color-error)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Skipped</span>
                                </span>
                                <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--color-warning)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Pending</span>
                                </span>
                                <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }} />
                                    <span style={{ color: 'var(--color-text-secondary)' }}>No challenge</span>
                                </span>
                                <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                    <span style={{ width: 12, height: 12, borderRadius: 4, border: '2px solid var(--color-accent)', boxShadow: '0 0 4px rgba(13, 148, 136, 0.3)' }} />
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Today</span>
                                </span>
                            </div>

                            {/* Goal Colors Legend (only if multiple goals and showing all) */}
                            {allGoals.length > 1 && selectedGoalId === 'all' && (
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
                        <h2 className="heading-4 mb-md" style={{ color: 'var(--color-text-primary)' }}>Progress by Goal</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {Array.from(goalStats.entries()).map(([goalId, stats]) => {
                                const colorIndex = goalId ? goalColorMap.get(goalId) ?? 0 : -1;
                                const color = colorIndex >= 0 ? GOAL_COLORS[colorIndex] : null;
                                const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                                const isComplete = completionRate === 100;
                                const isHighProgress = completionRate >= 75;

                                // Get gradient background style for goal card
                                const goalCardBg = color
                                    ? `linear-gradient(135deg, ${color.border}15 0%, transparent 60%)`
                                    : 'var(--color-surface)';

                                return (
                                    <div
                                        key={goalId || 'no-goal'}
                                        className="card goal-progress-card"
                                        style={{
                                            padding: '16px 20px',
                                            borderLeft: color ? `4px solid ${color.border}` : '4px solid var(--color-text-muted)',
                                            background: goalCardBg,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Completion Badge */}
                                        {isComplete && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: 'var(--gradient-success)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                                                animation: 'pulse 2s infinite'
                                            }}>
                                                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                                            </div>
                                        )}

                                        {/* Header with title and percentage */}
                                        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
                                            <span style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                maxWidth: isComplete ? '70%' : '60%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                color: 'var(--color-text-primary)'
                                            }}>
                                                {stats.title}
                                            </span>
                                            <span style={{
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                color: isComplete ? 'var(--color-success)' : isHighProgress ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                                display: isComplete ? 'none' : 'block'
                                            }}>
                                                {completionRate}%
                                            </span>
                                        </div>

                                        {/* Progress Bar Container */}
                                        <div className="progress-bar" style={{
                                            height: '10px',
                                            background: 'var(--color-surface-2)',
                                            borderRadius: 'var(--radius-full)',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            marginBottom: '12px'
                                        }}>
                                            {/* Completed Progress Fill with Gradient */}
                                            <div
                                                className="progress-bar-fill"
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    height: '100%',
                                                    width: `${(stats.completed / stats.total) * 100}%`,
                                                    background: color ? color.bg : 'var(--gradient-success)',
                                                    borderRadius: 'var(--radius-full)',
                                                    transition: 'width 0.5s ease-out',
                                                    boxShadow: isHighProgress ? `0 0 8px ${color?.border || 'rgba(16, 185, 129, 0.5)'}` : 'none'
                                                }}
                                            />
                                            {/* Skipped Portion (stacked after completed) */}
                                            {stats.skipped > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `${(stats.completed / stats.total) * 100}%`,
                                                    top: 0,
                                                    height: '100%',
                                                    width: `${(stats.skipped / stats.total) * 100}%`,
                                                    background: 'linear-gradient(135deg, var(--color-error) 0%, #f87171 100%)',
                                                    transition: 'width 0.5s ease-out'
                                                }} />
                                            )}
                                            {/* Shimmer Effect on High Progress */}
                                            {isHighProgress && !isComplete && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    height: '100%',
                                                    width: `${(stats.completed / stats.total) * 100}%`,
                                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                                    animation: 'shimmer 2s infinite'
                                                }} />
                                            )}
                                        </div>

                                        {/* Stats Row */}
                                        <div className="flex justify-between items-center text-tiny">
                                            <div className="flex gap-md">
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    color: 'var(--color-success)',
                                                    fontWeight: 500
                                                }}>
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: color ? color.bg : 'var(--gradient-success)',
                                                        display: 'inline-block'
                                                    }} />
                                                    {stats.completed} done
                                                </span>
                                                {stats.skipped > 0 && (
                                                    <span style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        color: 'var(--color-error)',
                                                        fontWeight: 500
                                                    }}>
                                                        <span style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: 'var(--color-error)',
                                                            display: 'inline-block'
                                                        }} />
                                                        {stats.skipped} skipped
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ color: 'var(--color-text-muted)' }}>
                                                {stats.completed + stats.skipped}/{stats.total} challenges
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            {/* Mood & Energy Trends Chart */}
            <>
                {/* Section Separator */}
                <hr className="section-separator-gradient" />

                <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
                        <h2 className="heading-4" style={{ color: 'var(--color-text-primary)' }}>Trends</h2>
                        {/* Metric Selector Tabs */}
                        <div className="flex bg-surface-2 rounded-full p-1 border border-border">
                            {(['mood', 'energy', 'motivation'] as const).map((metric) => (
                                <button
                                    key={metric}
                                    onClick={() => setSelectedMetric(metric)}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: selectedMetric === metric ? 'white' : 'var(--color-text-secondary)',
                                        background: selectedMetric === metric ? 'var(--color-primary)' : 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {metric}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Chart card wrapper with responsive container styling */}
                    <div
                        className="card chart-card"
                        style={{
                            minHeight: '300px',
                            height: '320px',
                            padding: 'var(--spacing-md)',
                            boxShadow: 'var(--shadow-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            willChange: 'box-shadow, transform'
                        }}
                    >
                        <MoodEnergyChart data={chartData} visibleMetrics={[selectedMetric]} />
                    </div>
                </section>
            </>

            {/* Visual Polish Styles */}
            <style jsx>{`
                /* Stat Card Interactive Styles */
                .stat-card-interactive {
                    transition: transform var(--transition-normal),
                                box-shadow var(--transition-normal),
                                border-color var(--transition-normal);
                    border: 1px solid transparent;
                }
                .stat-card-interactive:hover {
                    transform: translateY(-3px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--color-border);
                }

                /* Stat Value Color Variants */
                .stat-value-success {
                    color: var(--color-success);
                }
                .stat-value-accent {
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .stat-value-muted {
                    color: var(--color-text-secondary);
                }

                /* Calendar Cell Hover Styles */
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

                /* Goal Progress Card Styles */
                .goal-progress-card {
                    transition: transform var(--transition-normal),
                                box-shadow var(--transition-normal),
                                border-color var(--transition-normal);
                }
                .goal-progress-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                /* Chart Card Hover Effect */
                .chart-card {
                    transition: box-shadow var(--transition-normal),
                                transform var(--transition-normal);
                }
                .chart-card:hover {
                    box-shadow: var(--shadow-lg);
                }

                /* Calendar Card Hover Effect */
                .calendar-card:hover {
                    box-shadow: var(--shadow-lg);
                }

                /* Progress Bar Shimmer Animation */
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                /* Progress Bar Fill Glow Animation for Complete */
                .progress-bar-fill {
                    position: relative;
                }

                /* Section Heading Polish */
                :global(.heading-4) {
                    position: relative;
                    display: inline-block;
                }

                /* Legend Item Hover */
                .legend-item:hover {
                    background: var(--color-surface-hover);
                }
            `}</style>
        </div>
    );
}
