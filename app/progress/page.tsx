import Link from 'next/link';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BottomNavigation from '../components/BottomNavigation';
import PageHeader from '../components/PageHeader';

// Goal color palette for visual distinction
const GOAL_COLORS = [
    { bg: 'var(--gradient-primary)', border: 'var(--color-accent)' },
    { bg: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', border: '#8b5cf6' },
    { bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', border: '#f59e0b' },
    { bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', border: '#ec4899' },
    { bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', border: '#10b981' },
];

export default async function ProgressPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    // Get data
    const challenges = await db.getChallengesByUserId(user.userId, { limit: 30 });
    const surveys = await db.getSurveysByUserId(user.userId, 30);
    // const journals = await db.getDiaryEntriesByUserId(user.userId, 10);

    const activeGoal = await db.getActiveGoalByUserId(user.userId);

    // Fetch all goals for multi-goal support
    const allGoals = await db.getGoalsByUserId(user.userId);

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
    const streak = await db.calculateStreak(user.userId);
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
            isEmpty: true
        });
    }

    // Add the 30 days of data
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayChallenge = challenges.find(c =>
            new Date(c.scheduledDate).toISOString().split('T')[0] === dateStr
        );

        calendarData.push({
            date: dateStr,
            dayOfMonth: date.getDate(),
            status: (dayChallenge?.status as any) || 'none',
            isEmpty: false,
            goalId: dayChallenge?.goalId || null,
            goalTitle: dayChallenge?.goalTitle || null
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

    return (
        <div className="page animate-fade-in">
            {/* Header */}
            <PageHeader
                icon="📊"
                title="Your Progress"
                subtitle={activeGoal ? `Day ${dayInJourney} of your ${activeGoal.title} journey` : 'Track your transformation'}
            />

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
                <div className="card">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '6px'
                    }}>
                        {/* Weekday headers */}
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={i} className="text-tiny text-muted text-center" style={{
                                padding: '4px',
                                fontWeight: 500
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

                            return (
                                <div
                                    key={i}
                                    style={{
                                        aspectRatio: '1',
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
                                        border: day.date === new Date().toISOString().split('T')[0]
                                            ? '2px solid var(--color-accent)'
                                            : 'none',
                                        position: 'relative'
                                    }}
                                    title={day.date ? `${day.date}: ${day.status}${day.goalTitle ? ` (${day.goalTitle})` : ''}` : ''}
                                >
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
                                        lineHeight: 1
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

                            return (
                                <div
                                    key={goalId || 'no-goal'}
                                    className="card"
                                    style={{
                                        padding: '12px 16px',
                                        borderLeft: color ? `4px solid ${color.border}` : '4px solid var(--color-text-muted)'
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
                        <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                            {chartData.slice(-14).map((point, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div
                                        style={{
                                            height: `${point.mood * 10}% `,
                                            background: 'var(--gradient-primary)',
                                            borderRadius: '2px 2px 0 0',
                                            minHeight: '4px'
                                        }}
                                        title={`Mood: ${point.mood} `}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="text-tiny text-muted text-center mt-sm">
                            Last {Math.min(14, chartData.length)} days • Mood levels (1-10)
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
                        🏠 Dashboard
                    </Link>
                </div>
            </section>

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
}
