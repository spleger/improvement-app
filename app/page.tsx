import Link from 'next/link';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function safeFetch<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        console.error(`Dashboard: ${label} failed:`, err instanceof Error ? err.message : err);
        return fallback;
    }
}

async function getDashboardData(userId: string) {
    // Run all independent DB queries in parallel with individual error handling
    const [allGoals, todayChallenges, completedChallenges, streak, diaryCount, recentSurveys, habitStats, allMilestones, partners] =
        await Promise.all([
            safeFetch(() => db.getGoalsByUserId(userId), [] as any[], 'getGoalsByUserId'),
            safeFetch(() => db.getTodayChallenges(userId), [] as any[], 'getTodayChallenges'),
            safeFetch(() => db.getCompletedChallengesCount(userId), 0, 'getCompletedChallengesCount'),
            safeFetch(() => db.calculateStreak(userId), 0, 'calculateStreak'),
            safeFetch(() => db.getDiaryEntriesCount(userId), 0, 'getDiaryEntriesCount'),
            safeFetch(() => db.getSurveysByUserId(userId, 7), [] as any[], 'getSurveysByUserId'),
            safeFetch(() => db.getHabitStats(userId, 7), { habits: [], totalHabits: 0, completedToday: 0, weeklyCompletionRate: 0 }, 'getHabitStats'),
            safeFetch(() => db.getMilestonesByUserId(userId), [] as any[], 'getMilestonesByUserId'),
            safeFetch(() => db.getPartnersByUserId(userId), [] as any[], 'getPartnersByUserId'),
        ]);

    const activeGoals = allGoals.filter(g => g.status === 'active');
    const avgMood = recentSurveys.length > 0
        ? recentSurveys.reduce((sum, s) => sum + s.overallMood, 0) / recentSurveys.length
        : 0;
    const recentMilestones = allMilestones.filter(m => m.celebrated).slice(0, 3);

    // Get accountability partner stats (parallel per partner)
    let partnersWithStats: { id: string; partnerUserId: string; displayName: string; stats: { streak: number; weekChallenges: number; habitRate: number } }[] = [];
    if (partners.length > 0) {
        try {
            partnersWithStats = await Promise.all(
                partners.map(async (p) => {
                    const stats = await safeFetch(
                        () => db.getPartnerStats(p.partnerUserId),
                        { streak: 0, weekChallenges: 0, habitRate: 0, activeGoals: [] },
                        `getPartnerStats(${p.partnerUserId})`
                    );
                    return { ...p, stats: { streak: stats.streak, weekChallenges: stats.weekChallenges, habitRate: stats.habitRate } };
                })
            );
        } catch (err) {
            console.error('Dashboard: partnersWithStats failed:', err);
        }
    }

    const totalChallengesCompleted = todayChallenges.filter(c => c.status === 'completed').length;
    const totalChallengesTotal = todayChallenges.length;

    return {
        todayChallenges,
        activeGoals,
        allGoals,
        habitStats,
        recentMilestones,
        partnersWithStats,
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

import GoalCelebrationWrapper from './components/GoalCelebrationWrapper';
import MilestoneCelebration from './components/MilestoneCelebration';
import DashboardGoalSection from './components/DashboardGoalSection';
import DashboardQuickStats from './components/DashboardQuickStats';

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    const [dashboardData, preferences] = await Promise.all([
        getDashboardData(user.userId),
        safeFetch(() => db.getUserPreferences(user.userId), null, 'getUserPreferences'),
    ]);
    const { todayChallenges, activeGoals, allGoals, habitStats, recentMilestones, partnersWithStats, stats } = dashboardData;
    const challengesPerDay = preferences?.challengesPerDay || 1;
    const greeting = getGreeting();

    const pendingChallenges = todayChallenges.filter(c => c.status === 'pending');
    const generalChallenges = todayChallenges.filter(c => !c.goalId);

    // Show general section if we have general challenges OR if user has no goals (and needs something to do)
    const showGeneralSection = generalChallenges.length > 0 || activeGoals.length === 0;

    return (
        <div className="page animate-fade-in">
            <GoalCelebrationWrapper goals={activeGoals} />
            <MilestoneCelebration />
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
            <div className="card-glass mb-lg">
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

            <DashboardGoalSection
                activeGoals={activeGoals}
                todayChallenges={todayChallenges}
                showGeneralSection={showGeneralSection}
                generalChallenges={generalChallenges}
                challengesPerDay={challengesPerDay}
            />

            {/* Weekly Insights */}
            <section className="mb-lg">
                <div className="flex justify-between items-center mb-md">
                    <h2 className="heading-4">📈 Weekly Insights</h2>
                    <Link href="/digest" className="btn btn-ghost text-small">View Digest</Link>
                </div>
                <Link href="/digest" className="card-glass" style={{ display: 'block', textDecoration: 'none' }}>
                    <div className="flex items-center gap-md">
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                        }}>
                            [W]
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="heading-5">Your Weekly Digest</div>
                            <div className="text-small text-muted">
                                AI-powered summary of your progress, achievements, and next steps
                            </div>
                        </div>
                        <span style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                            {'\u2192'}
                        </span>
                    </div>
                </Link>
            </section>

            <DashboardQuickStats stats={stats} totalGoals={allGoals.length} />

            {/* Recent Achievements */}
            {recentMilestones.length > 0 && (
                <section className="mb-lg">
                    <h2 className="heading-4 mb-md">Recent Achievements</h2>
                    <div className="flex flex-col gap-sm">
                        {recentMilestones.map((milestone: any) => (
                            <div key={milestone.id} className="card-glass" style={{
                                padding: 'var(--spacing-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.4rem',
                                    flexShrink: 0,
                                }}>
                                    🐿️
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text-primary)',
                                    }}>
                                        {milestone.title}
                                    </div>
                                    {milestone.description && (
                                        <div className="text-small text-muted" style={{ marginTop: '2px' }}>
                                            {milestone.description}
                                        </div>
                                    )}
                                    <div className="text-small text-muted">
                                        {new Date(milestone.achievedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Habits Summary */}
            {
                habitStats.totalHabits > 0 && (
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
                )
            }

            {/* Accountability Partners */}
            {partnersWithStats.length > 0 && (
                <section className="mb-lg">
                    <div className="flex justify-between items-center mb-md">
                        <h2 className="heading-4">Partners</h2>
                        <Link href="/accountability" className="btn btn-ghost text-small">View All</Link>
                    </div>
                    <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                        {partnersWithStats.map((partner) => (
                            <Link
                                key={partner.id}
                                href="/accountability"
                                className="card-glass"
                                style={{
                                    textDecoration: 'none',
                                    flex: '1 1 140px',
                                    minWidth: '140px',
                                    maxWidth: '200px',
                                    padding: 'var(--spacing-md)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                }}
                            >
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                }}>
                                    {partner.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text)',
                                    textAlign: 'center',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%',
                                }}>
                                    {partner.displayName}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#f59e0b',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                }}>
                                    <span style={{ fontSize: '0.85rem' }}>*</span>
                                    {partner.stats.streak} day streak
                                </div>
                                <div className="text-small text-muted">
                                    {partner.stats.weekChallenges} challenges this week
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div >
    );
}


