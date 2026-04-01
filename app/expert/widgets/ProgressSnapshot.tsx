'use client';

interface Props {
    streak?: number;
    challengesCompleted?: number;
    totalChallenges?: number;
    avgMood?: number;
    habitCompletionRate?: number;
}

function getColor(value: number, max: number): string {
    const pct = value / max;
    if (pct <= 0.3) return '#ef4444';
    if (pct <= 0.6) return '#eab308';
    return '#22c55e';
}

export default function ProgressSnapshot({
    streak = 0,
    challengesCompleted = 0,
    totalChallenges = 0,
    avgMood,
    habitCompletionRate,
}: Props) {
    return (
        <div className="card p-4 my-2 bg-surface/80 backdrop-blur">
            <div className="text-xs text-muted uppercase tracking-wider mb-3 text-center">Your Progress</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <StatItem
                    label="Streak"
                    value={`${streak}`}
                    unit="days"
                    color={streak > 0 ? '#f59e0b' : '#6b7280'}
                />
                <StatItem
                    label="Challenges"
                    value={`${challengesCompleted}`}
                    unit={`of ${totalChallenges}`}
                    color={totalChallenges > 0 ? getColor(challengesCompleted, totalChallenges) : '#6b7280'}
                />
                {avgMood != null && (
                    <StatItem
                        label="Avg Mood"
                        value={`${avgMood}`}
                        unit="/10"
                        color={getColor(avgMood, 10)}
                    />
                )}
                {habitCompletionRate != null && (
                    <StatItem
                        label="Habit Rate"
                        value={`${habitCompletionRate}`}
                        unit="%"
                        color={getColor(habitCompletionRate, 100)}
                    />
                )}
            </div>
        </div>
    );
}

function StatItem({ label, value, unit, color }: {
    label: string;
    value: string;
    unit: string;
    color: string;
}) {
    return (
        <div className="text-center p-2 rounded-lg bg-background/50">
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs text-muted">{unit}</div>
            <div className="text-xs text-muted mt-1">{label}</div>
        </div>
    );
}
