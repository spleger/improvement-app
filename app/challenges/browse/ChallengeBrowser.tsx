'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Domain {
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    isRealityShift: boolean;
    instructions?: string;
    successCriteria?: string;
    durationMinutes?: number;
}

const DOMAIN_ICONS: Record<string, string> = {
    'Languages': '🗣️',
    'Mobility': '🧘',
    'Emotional Growth': '💜',
    'Relationships': '🤝',
    'Physical Health': '💪',
    'Tolerance': '🛡️',
    'Skills': '🎯',
    'Habits': '🔄'
};

export default function ChallengeBrowser({ domains }: { domains: Domain[] }) {
    const router = useRouter();
    const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
    const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        if (selectedDomain) {
            loadChallenges(selectedDomain);
        }
    }, [selectedDomain, difficultyFilter]);

    const loadChallenges = async (domainId: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/challenges/templates?domainId=${domainId}&difficulty=${difficultyFilter}`);
            const data = await response.json();
            if (data.success) {
                setChallenges(data.data.templates);
            }
        } catch (error) {
            console.error('Error loading challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAIChallenges = async (domainId: number) => {
        setLoading(true);
        try {
            // First, fetch user's active goals to find one for this domain
            const goalsResponse = await fetch('/api/goals');
            const goalsData = await goalsResponse.json();

            if (!goalsData.success || !goalsData.data?.goals?.length) {
                alert('Please create a goal first before generating challenges.');
                setLoading(false);
                return;
            }

            // Find an active goal matching this domain, or use the first active goal
            const activeGoals = goalsData.data.goals.filter((g: any) => g.status === 'active');
            const domainGoal = activeGoals.find((g: any) => g.domainId === domainId);
            const goalToUse = domainGoal || activeGoals[0];

            if (!goalToUse) {
                alert('No active goals found. Please create or activate a goal first.');
                setLoading(false);
                return;
            }

            // Now generate challenges with the goal ID
            const response = await fetch('/api/challenges/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId: goalToUse.id, count: 3 })
            });
            const data = await response.json();

            if (data.success && data.data.challenges) {
                // Map the generated challenges to the expected format
                const validChallenges = data.data.challenges.map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    difficulty: c.difficulty,
                    isRealityShift: c.isRealityShift,
                    instructions: c.instructions || c.description,
                    successCriteria: c.successCriteria || 'Complete the challenge as described'
                }));
                setChallenges(prev => [...prev, ...validChallenges]);
            } else {
                alert(data.error || 'Failed to generate challenges');
            }
        } catch (error) {
            console.error('Error generating challenges:', error);
            alert('Failed to generate challenges. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const acceptChallenge = async (challenge: Challenge) => {
        setAccepting(true);
        try {
            const response = await fetch('/api/challenges/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: challenge.id,
                    scheduledDate: new Date().toISOString()
                })
            });
            const data = await response.json();
            if (data.success) {
                router.push(`/challenges/${data.data.challenge.id}`);
            }
        } catch (error) {
            console.error('Error accepting challenge:', error);
        } finally {
            setAccepting(false);
        }
    };

    const getDifficultyLabel = (difficulty: number) => {
        if (difficulty <= 3) return { label: 'Easy', color: '#22c55e' };
        if (difficulty <= 6) return { label: 'Medium', color: '#f59e0b' };
        if (difficulty <= 8) return { label: 'Hard', color: '#f97316' };
        return { label: 'Extreme', color: '#ef4444' };
    };

    return (
        <div className="challenge-browser">
            {/* Domain Selection */}
            {!selectedDomain && (
                <section className="mb-lg">
                    <h2 className="heading-4 mb-md">Choose a Domain</h2>
                    <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                        {domains.map(domain => (
                            <button
                                key={domain.id}
                                onClick={() => setSelectedDomain(domain.id)}
                                className="card text-center"
                                style={{
                                    cursor: 'pointer',
                                    border: '2px solid transparent',
                                    transition: 'all 0.2s',
                                    padding: '1.5rem 1rem'
                                }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                    {DOMAIN_ICONS[domain.name] || '🎯'}
                                </div>
                                <div className="heading-5">{domain.name}</div>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Domain Selected - Show Filters and Challenges */}
            {selectedDomain && !selectedChallenge && (
                <>
                    {/* Domain Header */}
                    <div className="flex items-center gap-md mb-lg">
                        <button
                            onClick={() => setSelectedDomain(null)}
                            className="btn btn-ghost"
                        >
                            ← Domains
                        </button>
                        <h2 className="heading-4">
                            {DOMAIN_ICONS[domains.find(d => d.id === selectedDomain)?.name || '']}
                            {' '}{domains.find(d => d.id === selectedDomain)?.name}
                        </h2>
                    </div>

                    {/* Difficulty Filter */}
                    <div className="flex gap-sm mb-lg flex-wrap">
                        {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
                            <button
                                key={diff}
                                onClick={() => setDifficultyFilter(diff)}
                                className={`btn ${difficultyFilter === diff ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {diff === 'all' ? '📋 All' :
                                    diff === 'easy' ? '🟢 Easy' :
                                        diff === 'medium' ? '🟡 Medium' : '🔴 Hard'}
                            </button>
                        ))}
                    </div>

                    {/* Challenges List */}
                    {loading ? (
                        <div className="card text-center">
                            <div className="animate-pulse">Loading challenges...</div>
                        </div>
                    ) : challenges.length === 0 ? (
                        <div className="card text-center">
                            <p className="text-muted">No challenges found for this filter.</p>
                            <button
                                onClick={() => loadAIChallenges(selectedDomain)}
                                className="btn btn-primary mt-md"
                                disabled={loading}
                            >
                                ✨ Generate with AI
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-md">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => loadAIChallenges(selectedDomain)}
                                    className="btn btn-ghost text-small"
                                    disabled={loading}
                                >
                                    ✨ Generate More (AI)
                                </button>
                            </div>
                            {challenges.map(challenge => {
                                const diffInfo = getDifficultyLabel(challenge.difficulty);
                                return (
                                    <button
                                        key={challenge.id}
                                        onClick={() => setSelectedChallenge(challenge)}
                                        className={`card text-left ${challenge.isRealityShift ? 'reality-shift' : ''}`}
                                        style={{ cursor: 'pointer', width: '100%' }}
                                    >
                                        <div className="flex items-start gap-md">
                                            <div style={{ flex: 1 }}>
                                                <div className="flex items-center gap-sm mb-xs">
                                                    <span className="heading-5">{challenge.title}</span>
                                                    {challenge.isRealityShift && (
                                                        <span style={{ fontSize: '0.75rem', color: '#f12711' }}>⚡ Reality Shift</span>
                                                    )}
                                                </div>
                                                <p className="text-small text-muted mb-sm" style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {challenge.description}
                                                </p>
                                                <div className="flex gap-sm">
                                                    <span
                                                        className="challenge-badge"
                                                        style={{ background: diffInfo.color, color: 'white' }}
                                                    >
                                                        {diffInfo.label} ({challenge.difficulty}/10)
                                                    </span>
                                                    {challenge.durationMinutes && challenge.durationMinutes > 0 && (
                                                        <span className="challenge-badge">
                                                            ⏱️ {challenge.durationMinutes}min
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>→</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Challenge Detail Modal */}
            {selectedChallenge && (
                <div className="challenge-detail-modal">
                    {/* Back Button */}
                    <button
                        onClick={() => setSelectedChallenge(null)}
                        className="btn btn-ghost mb-lg"
                    >
                        ← Back to List
                    </button>

                    {/* Challenge Card */}
                    <div className={`card ${selectedChallenge.isRealityShift ? 'reality-shift' : ''}`}>
                        <div className="flex items-center gap-sm mb-md">
                            {selectedChallenge.isRealityShift && (
                                <span className="challenge-badge challenge-badge-reality-shift">⚡ Reality Shift</span>
                            )}
                            <span
                                className="challenge-badge"
                                style={{
                                    background: getDifficultyLabel(selectedChallenge.difficulty).color,
                                    color: 'white'
                                }}
                            >
                                {getDifficultyLabel(selectedChallenge.difficulty).label}
                            </span>
                        </div>

                        <h2 className="heading-3 mb-md">{selectedChallenge.title}</h2>

                        <p className="text-body mb-lg">{selectedChallenge.description}</p>

                        {selectedChallenge.instructions && (
                            <div className="mb-lg">
                                <h3 className="heading-5 mb-sm">📋 Instructions</h3>
                                <p className="text-secondary">{selectedChallenge.instructions}</p>
                            </div>
                        )}

                        {selectedChallenge.successCriteria && (
                            <div className="mb-lg">
                                <h3 className="heading-5 mb-sm">✓ Success Criteria</h3>
                                <div className="card card-surface">
                                    <p>{selectedChallenge.successCriteria}</p>
                                </div>
                            </div>
                        )}

                        {/* Difficulty Bar */}
                        <div className="mb-lg">
                            <h3 className="heading-5 mb-sm">💪 Difficulty</h3>
                            <div className="difficulty-bar">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`difficulty-bar-segment ${i < selectedChallenge.difficulty ? 'filled' : ''}`}
                                        style={{
                                            background: i < selectedChallenge.difficulty
                                                ? getDifficultyLabel(selectedChallenge.difficulty).color
                                                : undefined
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Accept Button */}
                        <button
                            onClick={() => acceptChallenge(selectedChallenge)}
                            className="btn btn-success w-full"
                            disabled={accepting}
                            style={{ fontSize: '1.125rem', padding: '1rem' }}
                        >
                            {accepting ? '⏳ Scheduling...' : '✅ Accept This Challenge'}
                        </button>

                        <p className="text-center text-small text-muted mt-md">
                            This will schedule the challenge for today
                        </p>
                    </div>
                </div>
            )}

            <style jsx>{`
        .difficulty-bar {
          display: flex;
          gap: 4px;
          height: 12px;
        }
        .difficulty-bar-segment {
          flex: 1;
          border-radius: 4px;
          background: var(--color-surface);
        }
        .difficulty-bar-segment.filled {
          background: var(--color-primary);
        }
      `}</style>
        </div>
    );
}
