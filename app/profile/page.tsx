import Link from 'next/link';
import * as db from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

async function getProfileData() {
    const goals = await db.getGoalsByUserId(DEMO_USER_ID);
    const challenges = await db.getChallengesByUserId(DEMO_USER_ID, { limit: 100 });
    const streak = await db.calculateStreak(DEMO_USER_ID);
    const diaryCount = await db.getDiaryEntriesCount(DEMO_USER_ID);

    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    // Calculate total days in journey
    const firstGoal = goals[goals.length - 1];
    const daysOnPlatform = firstGoal
        ? Math.ceil((Date.now() - new Date(firstGoal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return {
        stats: {
            streak,
            completedChallenges,
            activeGoals,
            completedGoals,
            totalGoals: goals.length,
            diaryCount,
            daysOnPlatform
        },
        goals
    };
}

export default async function ProfilePage() {
    const { stats, goals } = await getProfileData();

    return (
        <div className="page animate-fade-in">
            {/* Header */}
            <div className="page-header text-center">
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '2.5rem'
                }}>
                    👤
                </div>
                <h1 className="heading-2">Demo User</h1>
                <p className="text-secondary">
                    {stats.daysOnPlatform} days on your transformation journey
                </p>
            </div>

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
                                    <span className={`text-tiny ${goal.status === 'active' ? 'text-success' : 'text-muted'}`}>
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
                    <button className="card flex items-center gap-md" style={{ width: '100%', textAlign: 'left' }}>
                        <span>🎨</span>
                        <span style={{ flex: 1 }}>Theme</span>
                        <span className="text-muted">Minimal</span>
                    </button>
                    <button className="card flex items-center gap-md" style={{ width: '100%', textAlign: 'left' }}>
                        <span>🔔</span>
                        <span style={{ flex: 1 }}>Notifications</span>
                        <span className="text-muted">On</span>
                    </button>
                    <button className="card flex items-center gap-md" style={{ width: '100%', textAlign: 'left' }}>
                        <span>🌍</span>
                        <span style={{ flex: 1 }}>Timezone</span>
                        <span className="text-muted">Auto</span>
                    </button>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="mb-lg">
                <div className="card card-surface">
                    <p className="text-small text-muted text-center">
                        Demo account • Data resets periodically
                    </p>
                </div>
            </section>

            {/* Bottom Navigation */}
            <nav className="nav-bottom">
                <div className="nav-bottom-inner">
                    <Link href="/" className="nav-item"><span className="nav-item-icon">🏠</span><span className="nav-item-label">Home</span></Link>
                    <Link href="/progress" className="nav-item"><span className="nav-item-icon">📊</span><span className="nav-item-label">Progress</span></Link>
                    <Link href="/diary" className="nav-item"><span className="nav-item-icon">🎙️</span><span className="nav-item-label">Diary</span></Link>
                    <Link href="/expert" className="nav-item"><span className="nav-item-icon">💬</span><span className="nav-item-label">Expert</span></Link>
                    <Link href="/profile" className="nav-item active"><span className="nav-item-icon">👤</span><span className="nav-item-label">Profile</span></Link>
                </div>
            </nav>
        </div>
    );
}
