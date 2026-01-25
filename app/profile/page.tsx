import Link from 'next/link';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BottomNavigation from '../components/BottomNavigation';
import PageHeader from '../components/PageHeader';

export default async function ProfilePage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    // Get all user data
    const goals = await db.getGoalsByUserId(user.userId);
    const challenges = await db.getChallengesByUserId(user.userId, { limit: 100 });
    const streak = await db.calculateStreak(user.userId);
    const diaryCount = await db.getDiaryEntriesCount(user.userId);

    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    // Calculate total days in journey
    const firstGoal = goals[goals.length - 1];
    const daysOnPlatform = firstGoal
        ? Math.ceil((Date.now() - new Date(firstGoal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const stats = {
        streak,
        completedChallenges,
        activeGoals,
        completedGoals,
        totalGoals: goals.length,
        diaryCount,
        daysOnPlatform
    };

    return (
        <div className="page animate-fade-in">
            {/* Header */}
            <PageHeader
                icon="👤"
                title="My Profile"
                subtitle={`${stats.daysOnPlatform} days on your transformation journey`}
            />

            {/* Stats Grid */}
            <section className="mb-lg">
                <h2 className="heading-4 mb-md">Your Stats</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value fire">{stats.streak}</div>
                        <div className="stat-label">Current Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.completedChallenges}</div>
                        <div className="stat-label">Challenges Done</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.completedGoals}</div>
                        <div className="stat-label">Goals Completed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.diaryCount}</div>
                        <div className="stat-label">Diary Entries</div>
                    </div>
                </div>
            </section>

            {/* Active Goals */}
            <section className="mb-lg">
                <div className="flex justify-between items-center mb-md">
                    <h2 className="heading-4">Your Goals</h2>
                    <Link href="/goals/new" className="btn btn-ghost text-small">
                        + New Goal
                    </Link>
                </div>

                {goals.length === 0 ? (
                    <div className="card text-center">
                        <p className="text-secondary">No goals yet. Start your transformation!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-md">
                        {goals.map(goal => (
                            <div key={goal.id} className="card">
                                <div className="flex items-center gap-md">
                                    <span style={{
                                        fontSize: '1.5rem',
                                        opacity: goal.status === 'completed' ? 0.5 : 1
                                    }}>
                                        {goal.status === 'completed' ? '✅' : '🎯'}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div className="heading-4">{goal.title}</div>
                                        <div className="text-small text-muted">
                                            {goal.domain?.name || 'General'} •
                                            Started {new Date(goal.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <span className={`text-tiny ${goal.status === 'active' ? 'text-success' : 'text-muted'} `}>
                                        {goal.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Settings Section */}
            <section className="mb-lg">
                <h2 className="heading-4 mb-md">Settings</h2>
                <div className="flex flex-col gap-sm">
                    <Link href="/settings" className="card flex items-center gap-md" style={{ width: '100%', textAlign: 'left', textDecoration: 'none', color: 'inherit' }}>
                        <span>⚙️</span>
                        <span style={{ flex: 1 }}>General Settings</span>
                        <span className="text-muted">→</span>
                    </Link>
                    <Link href="/api/auth/logout" className="card flex items-center gap-md" style={{ width: '100%', textAlign: 'left', textDecoration: 'none', color: 'var(--color-error)' }}>
                        <span>🚪</span>
                        <span style={{ flex: 1 }}>Logout</span>
                        <span className="text-muted">→</span>
                    </Link>
                </div>
            </section>

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
}
