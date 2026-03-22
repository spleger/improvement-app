interface DashboardQuickStatsProps {
    stats: {
        streak: number;
        completedChallenges: number;
        avgMood: number;
    };
    totalGoals: number;
}

export default function DashboardQuickStats({ stats, totalGoals }: DashboardQuickStatsProps) {
    return (
        <section className="mb-lg">
            <h2 className="heading-4 mb-md">{'\uD83D\uDCCA'} Stats</h2>
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
                    <div className="stat-value">{totalGoals}</div>
                    <div className="stat-label">Goals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.avgMood || '\u2014'}</div>
                    <div className="stat-label">Avg Mood</div>
                </div>
            </div>
        </section>
    );
}
