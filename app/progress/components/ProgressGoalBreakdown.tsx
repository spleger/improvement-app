'use client';

import { type GoalStatEntry, GOAL_COLORS } from '../hooks/useProgressData';

interface ProgressGoalBreakdownProps {
    goalStats: Map<string | null, GoalStatEntry>;
    goalColorMap: Map<string | null, number>;
}

export function ProgressGoalBreakdown({
    goalStats,
    goalColorMap,
}: ProgressGoalBreakdownProps) {
    if (goalStats.size <= 1) {
        return null;
    }

    return (
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
                                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{'\u2713'}</span>
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
            <style jsx>{`
                .goal-progress-card {
                    transition: transform var(--transition-normal),
                                box-shadow var(--transition-normal),
                                border-color var(--transition-normal);
                }
                .goal-progress-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }
                .progress-bar-fill {
                    position: relative;
                }
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </>
    );
}
