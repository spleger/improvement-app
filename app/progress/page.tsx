import Link from 'next/link';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BottomNavigation from '../components/BottomNavigation';
import PageHeader from '../components/PageHeader';

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

    const completedChallenges = challenges.filter(c => c.status === 'completed');
    const skippedChallenges = challenges.filter(c => c.status === 'skipped');

    // Calculate stats
    const streak = await db.calculateStreak(user.userId);
    const completedCount = completedChallenges.length;
    const skippedCount = skippedChallenges.length;
    const totalCount = challenges.length;

    // Build calendar data for last 30 days with proper weekday alignment
    const calendarData: { date: string; dayOfMonth: number; status: 'completed' | 'skipped' | 'pending' | 'none'; isEmpty?: boolean }[] = [];

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
            isEmpty: false
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
            <section className="mb-lg">
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

            {/* Calendar View */}
            <section className="mb-lg">
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
                        {calendarData.map((day, i) => (
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
                                    background: day.status === 'completed'
                                        ? 'var(--gradient-success)'
                                        : day.status === 'skipped'
                                            ? 'var(--color-error)'
                                            : day.status === 'pending'
                                                ? 'var(--color-warning)'
                                                : 'var(--color-surface)',
                                    color: ['completed', 'skipped'].includes(day.status) ? 'white' : 'var(--color-text-muted)',
                                    border: day.date === new Date().toISOString().split('T')[0]
                                        ? '2px solid var(--color-accent)'
                                        : 'none'
                                }}
                                title={day.date ? `${day.date}: ${day.status}` : ''}
                            >
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
                        ))}
                    </div>
                    {/* Legend */}
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
                </div>
            </section>

            {/* Mood Chart (Simplified) */}
            {chartData.length > 0 && (
                <section className="mb-lg">
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
            )}

            {/* Quick Actions */}
            <section className="mb-lg">
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
