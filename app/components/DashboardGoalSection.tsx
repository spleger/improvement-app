import Link from 'next/link';
import GoalActions from './GoalActions';
import DailyChallengeLoader from './DailyChallengeLoader';

interface DashboardGoalSectionProps {
    activeGoals: any[];
    todayChallenges: any[];
    showGeneralSection: boolean;
    generalChallenges: any[];
}

export default function DashboardGoalSection({
    activeGoals,
    todayChallenges,
    showGeneralSection,
    generalChallenges,
}: DashboardGoalSectionProps) {
    return (
        <>
            {/* Daily Growth (General Challenges) */}
            {showGeneralSection && (
                <section className="mb-lg">
                    <div className="flex justify-between items-center mb-md">
                        <h2 className="heading-4">🌱 Daily Growth</h2>
                    </div>

                    {generalChallenges.length === 0 ? (
                        <DailyChallengeLoader goalId={null} goalTitle="Daily Growth" />
                    ) : (
                        <div className="flex flex-col gap-md">
                            {generalChallenges.map(challenge => (
                                <ChallengeCard key={challenge.id} challenge={challenge} />
                            ))}
                        </div>
                    )}
                </section>
            )}

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

                            const goalChallenges = todayChallenges.filter((c: any) => c.goalId === goal.id);
                            const pendingGoalChallenges = goalChallenges.filter((c: any) => c.status === 'pending');
                            const completedGoalChallenges = goalChallenges.filter((c: any) => c.status === 'completed');

                            return (
                                <div key={goal.id}>
                                    {/* Goal Card */}
                                    <div className="card-glass">
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
                                                {goal.domain?.name === 'Languages' ? '\uD83D\uDDE3\uFE0F' :
                                                    goal.domain?.name === 'Mobility' ? '\uD83E\uDDD8' :
                                                        goal.domain?.name === 'Emotional Growth' ? '\uD83D\uDC9C' :
                                                            goal.domain?.name === 'Relationships' ? '\uD83E\uDD1D' :
                                                                goal.domain?.name === 'Physical Health' ? '\uD83D\uDCAA' :
                                                                    goal.domain?.name === 'Tolerance' ? '\uD83D\uDEE1\uFE0F' :
                                                                        goal.domain?.name === 'Skills' ? '\uD83C\uDFAF' :
                                                                            goal.domain?.name === 'Habits' ? '\uD83D\uDD04' : '\uD83C\uDFAF'}
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
                                    {goalChallenges.length > 0 ? (
                                        <div style={{
                                            marginLeft: '1rem',
                                            marginTop: '0.75rem',
                                            paddingLeft: '1rem',
                                            borderLeft: '3px solid var(--color-accent)',
                                            position: 'relative'
                                        }}>
                                            {/* Challenge count label */}
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--color-text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                marginBottom: '0.5rem',
                                                paddingLeft: '0.25rem'
                                            }}>
                                                {goalChallenges.length} Challenge{goalChallenges.length !== 1 ? 's' : ''} Today
                                            </div>

                                            {/* Pending Challenges */}
                                            <div className="flex flex-col gap-sm">
                                                {pendingGoalChallenges.map((challenge: any) => (
                                                    <ChallengeCard key={challenge.id} challenge={challenge} />
                                                ))}
                                            </div>

                                            {/* Completed Challenges - Show individual cards */}
                                            {completedGoalChallenges.length > 0 && (
                                                <div style={{ marginTop: pendingGoalChallenges.length > 0 ? '0.75rem' : '0' }}>
                                                    {pendingGoalChallenges.length > 0 && (
                                                        <div style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--color-success)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            marginBottom: '0.5rem',
                                                            paddingLeft: '0.25rem'
                                                        }}>
                                                            {'\u2713'} Completed
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-sm">
                                                        {completedGoalChallenges.map((challenge: any) => (
                                                            <ChallengeCard key={challenge.id} challenge={challenge} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{
                                            marginLeft: '1rem',
                                            marginTop: '0.75rem',
                                            paddingLeft: '1rem',
                                            borderLeft: '3px dashed var(--color-border)',
                                        }}>
                                            <DailyChallengeLoader goalId={goal.id} goalTitle={goal.title} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </section >

            {/* No Challenges Prompt - Only shown when there are no challenges */}
            {
                todayChallenges.length === 0 && activeGoals.length > 0 && (
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
                )
            }
        </>
    );
}

function ChallengeCard({ challenge }: { challenge: any }) {
    const isCompleted = challenge.status === 'completed';
    const isRealityShift = challenge.isRealityShift;

    const getDifficultyColor = (d: number) => {
        if (d <= 3) return '#16a34a';
        if (d <= 6) return '#d97706';
        return '#dc2626';
    };

    const getDifficultyLabel = (d: number) => {
        if (d <= 3) return 'Easy';
        if (d <= 6) return 'Medium';
        return 'Hard';
    };

    const difficultyColor = getDifficultyColor(challenge.difficulty);

    return (
        <Link
            href={`/challenges/${challenge.id}`}
            className={`challenge-card ${isRealityShift ? 'reality-shift' : ''} ${isCompleted ? 'completed' : ''}`}
            style={{
                textDecoration: 'none',
                display: 'block',
                background: 'var(--color-surface)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-md)',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Top accent bar based on difficulty */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: isRealityShift
                    ? 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)'
                    : isCompleted
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                        : `linear-gradient(135deg, ${difficultyColor} 0%, ${difficultyColor}dd 100%)`
            }} />

            <div className="flex items-start gap-md">
                {/* Difficulty indicator badge */}
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${difficultyColor} 0%, ${difficultyColor}cc 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${difficultyColor}40`
                }}>
                    <span>{challenge.difficulty}</span>
                </div>

                {/* Challenge content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-sm" style={{ marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: isCompleted ? 'var(--color-success)' : 'var(--color-text-primary)'
                        }}>
                            {isCompleted && '\u2713 '}{challenge.title}
                        </span>
                        {isRealityShift && (
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'linear-gradient(135deg, #f12711, #f5af19)',
                                color: 'white',
                                fontWeight: 600
                            }}>
                                {'\u26A1'} REALITY SHIFT
                            </span>
                        )}
                    </div>
                    <p className="text-small text-muted" style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                        margin: 0
                    }}>
                        {challenge.description}
                    </p>
                    {/* Difficulty label */}
                    <div style={{
                        marginTop: '6px',
                        fontSize: '0.7rem',
                        color: difficultyColor,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {getDifficultyLabel(challenge.difficulty)} {'\u2022'} Difficulty {challenge.difficulty}/10
                    </div>
                </div>

                {/* Navigation arrow */}
                <span style={{
                    fontSize: '1.25rem',
                    color: 'var(--color-text-muted)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center'
                }}>{'\u2192'}</span>
            </div>
        </Link>
    );
}
