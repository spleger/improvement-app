import Link from 'next/link';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProgressTrendsChart from './components/ProgressTrendsChart';
import GoalSelector from './components/GoalSelector';


export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ goalId?: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const params = await searchParams;
    const selectedGoalId = params.goalId || null;

    // Get data
    const allChallenges = await db.getChallengesByUserId(user.userId, { limit: 30 });
    const surveys = await db.getSurveysByUserId(user.userId, 365);

    // Get all goals to filter out completed/deleted ones
    const allGoals = await db.getGoalsByUserId(user.userId);
    const activeGoals = allGoals.filter(g => g.status === 'active');
    const activeGoalIds = new Set(activeGoals.map(g => g.id));

    // Find the selected or active goal for the header
    const activeGoal = selectedGoalId
        ? activeGoals.find(g => g.id === selectedGoalId) || null
        : activeGoals[0] || null;

    // Filter challenges by selected goal, or show all active goal challenges
    const challenges = selectedGoalId
        ? allChallenges.filter(c => c.goalId === selectedGoalId)
        : allChallenges.filter(c => !c.goalId || activeGoalIds.has(c.goalId));

    const completedChallenges = challenges.filter(c => c.status === 'completed');
    const skippedChallenges = challenges.filter(c => c.status === 'skipped');

    // Calculate stats
    const streak = await db.calculateStreak(user.userId);
    const completedCount = completedChallenges.length;
    const skippedCount = skippedChallenges.length;
    const totalCount = challenges.length;

    // Build calendar data for last 30 days
    const calendarData: { date: string; status: 'completed' | 'skipped' | 'pending' | 'none' }[] = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayChallenge = challenges.find(c =>
            new Date(c.scheduledDate).toISOString().split('T')[0] === dateStr
        );

        calendarData.push({
            date: dateStr,
            status: (dayChallenge?.status as any) || 'none'
        });
    }

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
            <div className="page-header">
                <h1 className="heading-2">📊 Your Progress</h1>
                {activeGoal && (
                    <p className="text-secondary" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        Day {dayInJourney} of your <strong>{activeGoal.title}</strong> journey
                    </p>
                )}
            </div>

            {/* Goal Selector */}
            <GoalSelector
                goals={activeGoals.map(g => ({ id: g.id, title: g.title }))}
                selectedGoalId={selectedGoalId}
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
                <h2 className="heading-4 mb-md">Last 30 Days</h2>
                <div className="card">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px'
                    }}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                            <div key={i} className="text-tiny text-muted text-center" style={{ padding: '4px' }}>
                                {day}
                            </div>
                        ))}
                        {calendarData.map((day, i) => (
                            <div
                                key={i}
                                style={{
                                    aspectRatio: '1',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    background: day.status === 'completed'
                                        ? 'var(--gradient-success)'
                                        : day.status === 'skipped'
                                            ? 'var(--color-error)'
                                            : day.status === 'pending'
                                                ? 'var(--color-warning)'
                                                : 'var(--color-surface)',
                                    color: ['completed', 'skipped'].includes(day.status) ? 'white' : 'var(--color-text-muted)'
                                }}
                                title={`${day.date}: ${day.status} `}
                            >
                                {day.status === 'completed' && '✓'}
                                {day.status === 'skipped' && '✗'}
                                {day.status === 'pending' && '○'}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-lg mt-md text-tiny">
                        <span className="flex items-center gap-sm">
                            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--gradient-success)' }} />
                            Completed
                        </span>
                        <span className="flex items-center gap-sm">
                            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-error)' }} />
                            Skipped
                        </span>
                        <span className="flex items-center gap-sm">
                            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-surface)' }} />
                            No challenge
                        </span>
                    </div>
                </div>
            </section>

            {/* Trends Chart */}
            {chartData.length > 0 && (
                <section className="mb-lg">
                    <h2 className="heading-4 mb-md">Trends</h2>
                    <ProgressTrendsChart data={chartData} />
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

        </div>
    );
}
