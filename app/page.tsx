import Link from 'next/link';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function getDashboardData(userId: string) {
    // Get ALL user's goals (not just active)
    const allGoals = await db.getGoalsByUserId(userId);
    const activeGoals = allGoals.filter(g => g.status === 'active');

    // Get ALL today's challenges (multiple!)
    const todayChallenges = await db.getTodayChallenges(userId);

    // Get completed challenges count
    const completedChallenges = await db.getCompletedChallengesCount(userId);

    // Calculate streak
    const streak = await db.calculateStreak(userId);

    // Get diary entries count
    const diaryCount = await db.getDiaryEntriesCount(userId);

    // Get average mood from surveys
    const recentSurveys = await db.getSurveysByUserId(userId, 7);
    const avgMood = recentSurveys.length > 0
        ? recentSurveys.reduce((sum, s) => sum + s.overallMood, 0) / recentSurveys.length
        : 0;

    // Get habit stats
    const habitStats = await db.getHabitStats(userId, 7);

    // Calculate overall progress
    const totalChallengesCompleted = todayChallenges.filter(c => c.status === 'completed').length;
    const totalChallengesTotal = todayChallenges.length;

    return {
        todayChallenges,
        activeGoals,
        allGoals,
        habitStats,
        stats: {
            streak,
            completedChallenges,
            diaryCount,
            avgMood: Math.round(avgMood * 10) / 10,
            todayCompleted: totalChallengesCompleted,
            todayTotal: totalChallengesTotal
        }
    };
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '🌅' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
    return { text: 'Good evening', emoji: '🌙' };
}

import ThemeToggle from './ThemeToggle';
import GoalCelebrationWrapper from './components/GoalCelebrationWrapper';
import GoalActions from './components/GoalActions';

// ... (keep existing imports)

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const { todayChallenges, activeGoals, allGoals, habitStats, stats } = await getDashboardData(user.userId);
    const greeting = getGreeting();

    const pendingChallenges = todayChallenges.filter(c => c.status === 'pending');
    const completedToday = todayChallenges.filter(c => c.status === 'completed');

    return (
        <div className="page animate-fade-in">
            <GoalCelebrationWrapper goals={activeGoals} />
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="greeting">
                    {greeting.text}! <span className="greeting-emoji">{greeting.emoji}</span>
                </h1>
            </div>

            {/* Today's Progress Bar */}
            {todayChallenges.length > 0 && (
                <div className="card mb-lg" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                    <div className="flex justify-between items-center mb-sm">
                        <span className="heading-5">Today's Progress</span>
                        <span className="heading-4">{stats.todayCompleted}/{stats.todayTotal}</span>
                    </div>
                    <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.3)' }}>
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0}%`,
                                background: 'white'
                            }}
                        />
                    </div>
                    <div className="text-small mt-sm" style={{ opacity: 0.9 }}>
                        {stats.todayCompleted === stats.todayTotal && stats.todayTotal > 0
                            ? '🎉 All challenges complete!'
                            : `${pendingChallenges.length} challenge${pendingChallenges.length !== 1 ? 's' : ''} remaining`}
                    </div>
                </div>
            )}

            {/* Challenge Summary Section */}
            <div className="card-glass mb-lg" style={{
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
                <div className="flex items-center gap-md mb-sm">
                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                    <span className="heading-5">Challenge Summary</span>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <div className="flex flex-col items-center" style={{
                        flex: 1,
                        minWidth: '80px',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px'
                    }}>
                        <span className="heading-3" style={{ color: 'var(--color-primary)' }}>
                            {stats.todayTotal}
                        </span>
                        <span className="text-small text-muted">Today</span>
                    </div>
                    <div className="flex flex-col items-center" style={{
                        flex: 1,
                        minWidth: '80px',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px'
                    }}>
                        <span className="heading-3" style={{ color: '#f59e0b' }}>
                            {pendingChallenges.length}
                        </span>
                        <span className="text-small text-muted">Pending</span>
                    </div>
                    <div className="flex flex-col items-center" style={{
                        flex: 1,
                        minWidth: '80px',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px'
                    }}>
                        <span className="heading-3" style={{ color: '#22c55e' }}>
                            {stats.completedChallenges}
                        </span>
                        <span className="text-small text-muted">Completed</span>
                    </div>
                </div>
            </div>

            {/* Active Goals with Nested Challenges */}
            <section className="mb-lg">
                <div className="flex justify-between items-center mb-md">
                    <h2 className="heading-4">🎯 Your Goals ({activeGoals.length})</h2>
                    <Link href="/goals/new" className="btn btn-ghost text-small">+ Add Goal</Link>
                </div>

                {activeGoals.length === 0 ? (
                    <Link href="/goals/new" className="card-glass card-highlight" style={{ display: 'block', textDecoration: 'none' }}>
                        <div className="heading-4 mb-md">🚀 Start Your Transformation</div>
                        <p className="text-secondary">Set your first goal to begin receiving daily challenges.</p>
                    </Link>
                ) : (
                    <div className="flex flex-col gap-lg">
                        {activeGoals.map(goal => {
                            const dayInJourney = Math.ceil((Date.now() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24));
                            const progress = Math.min(Math.round((dayInJourney / 30) * 100), 100);
                            // Get challenges for this goal
                            const goalChallenges = todayChallenges.filter(c => c.goalId === goal.id);
                            const pendingGoalChallenges = goalChallenges.filter(c => c.status === 'pending');
                            const completedGoalChallenges = goalChallenges.filter(c => c.status === 'completed');

                            return (
                                <div key={goal.id}>
                                    {/* Goal Card */}
                                    <div className="card-glass" style={{
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: goal.domain?.color || 'var(--gradient-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                flexShrink: 0
                                            }}>
                                                {goal.domain?.name === 'Languages' ? '🗣️' :
                                                    goal.domain?.name === 'Mobility' ? '🧘' :
                                                        goal.domain?.name === 'Emotional Growth' ? '💜' :
                                                            goal.domain?.name === 'Relationships' ? '🤝' :
                                                                goal.domain?.name === 'Physical Health' ? '💪' :
                                                                    goal.domain?.name === 'Tolerance' ? '🛡️' :
                                                                        goal.domain?.name === 'Skills' ? '🎯' :
                                                                            goal.domain?.name === 'Habits' ? '🔄' : '🎯'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: '120px' }}>
                                                <div className="heading-5">{goal.title}</div>
                                                <div className="text-small text-muted">Day {dayInJourney}/30 • {progress}%</div>
                                            </div>
                                            <div className="flex gap-sm" style={{ flexShrink: 0 }}>
                                                <Link
                                                    href={`/challenges/generate?goalId=${goal.id}`}
                                                    className="btn btn-ghost text-small"
                                                    style={{
                                                        minHeight: '44px',
                                                        minWidth: '44px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '0.5rem 1rem'
                                                    }}
                                                >
                                                    + Challenge
                                                </Link>
                                                <GoalActions goalId={goal.id} goalTitle={goal.title} />
                                            </div>
                                        </div>
                                        <div className="progress-bar mt-md" style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)' }}>
                                            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    {/* Nested Challenges for this Goal */}
                                    {goalChallenges.length > 0 && (
                                        <div className="flex flex-col gap-sm" style={{
                                            marginLeft: '1.5rem',
                                            marginTop: '0.75rem',
                                            paddingLeft: '1rem',
                                            borderLeft: '2px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            {/* Pending Challenges */}
                                            {pendingGoalChallenges.map(challenge => (
                                                <ChallengeCard key={challenge.id} challenge={challenge} />
                                            ))}

                                            {/* Completed Challenges Summary */}
                                            {completedGoalChallenges.length > 0 && (
                                                <div className="card card-surface" style={{ padding: '0.75rem 1rem' }}>
                                                    <div className="flex items-center gap-sm text-success">
                                                        <span>✅</span>
                                                        <span className="text-small">{completedGoalChallenges.length} completed today</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* No Challenges Prompt - Only shown when there are no challenges */}
            {todayChallenges.length === 0 && activeGoals.length > 0 && (
                <section className="mb-lg">
                    <div className="card text-center">
                        <p className="text-secondary mb-md">No challenges scheduled for today.</p>
                        <div className="flex gap-sm justify-center">
                            <Link href={`/challenges/generate?goalId=${activeGoals[0].id}`} className="btn btn-primary">
                                Generate Challenge
                            </Link>
                            <Link href="/challenges/browse" className="btn btn-secondary">
                                Browse Library
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Quick Stats */}
            <section className="mb-lg">
                <h2 className="heading-4 mb-md">📊 Stats</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value fire">{stats.streak}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.completedChallenges}</div>
                        <div className="stat-label">Total Done</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{allGoals.length}</div>
                        <div className="stat-label">Goals</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.avgMood || '—'}</div>
                        <div className="stat-label">Avg Mood</div>
                    </div>
                </div>
            </section>

            {/* Habits Summary */}
            {habitStats.totalHabits > 0 && (
                <section className="mb-lg">
                    <div className="flex justify-between items-center mb-md">
                        <h2 className="heading-4">✅ Your Habits</h2>
                        <Link href="/habits" className="btn btn-ghost text-small">View All</Link>
                    </div>
                    <Link href="/habits" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                        <div className="flex items-center gap-md">
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: habitStats.completedToday === habitStats.totalHabits ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--gradient-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.25rem'
                            }}>
                                {habitStats.completedToday}/{habitStats.totalHabits}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="heading-5">
                                    {habitStats.completedToday === habitStats.totalHabits && habitStats.totalHabits > 0
                                        ? '🎉 All habits done today!'
                                        : `${habitStats.totalHabits - habitStats.completedToday} habit${habitStats.totalHabits - habitStats.completedToday !== 1 ? 's' : ''} remaining`
                                    }
                                </div>
                                <div className="text-small text-muted">Weekly rate: {habitStats.weeklyCompletionRate}%</div>
                            </div>
                            <span style={{ fontSize: '1.5rem' }}>→</span>
                        </div>
                        {/* Mini habit icons */}
                        <div className="flex gap-xs mt-md" style={{ flexWrap: 'wrap' }}>
                            {habitStats.habits.slice(0, 6).map((habit: any) => (
                                <span key={habit.id} title={habit.name} style={{
                                    fontSize: '1.25rem',
                                    opacity: habit.streak > 0 ? 1 : 0.4
                                }}>
                                    {habit.icon}
                                </span>
                            ))}
                            {habitStats.habits.length > 6 && (
                                <span className="text-small text-muted">+{habitStats.habits.length - 6}</span>
                            )}
                        </div>
                    </Link>
                </section>
            )}
        </div>
    );
}

// Challenge Card Component
function ChallengeCard({ challenge }: { challenge: any }) {
    const isCompleted = challenge.status === 'completed';
    const isRealityShift = challenge.isRealityShift;

    const getDifficultyColor = (d: number) => {
        if (d <= 3) return '#22c55e';
        if (d <= 6) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <Link
            href={`/challenges/${challenge.id}`}
            className={`challenge-card ${isRealityShift ? 'reality-shift' : ''} ${isCompleted ? 'completed' : ''}`}
            style={{ textDecoration: 'none', display: 'block' }}
        >
            <div className="flex items-start gap-md">
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: getDifficultyColor(challenge.difficulty),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.25rem'
                }}>
                    {challenge.difficulty}
                </div>
                <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="heading-5">{challenge.title}</span>
                        {isRealityShift && (
                            <span style={{ fontSize: '0.75rem', color: '#f12711' }}>⚡</span>
                        )}
                    </div>
                    <p className="text-small text-muted" style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                    }}>
                        {challenge.description}
                    </p>
                </div>
                <span style={{ fontSize: '1.5rem' }}>→</span>
            </div>
        </Link>
    );
}


