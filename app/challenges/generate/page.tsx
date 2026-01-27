'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface GeneratedChallenge {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    isRealityShift: boolean;
}

import { Suspense } from 'react';

function ChallengeGeneratorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const goalId = searchParams.get('goalId');

    const [generating, setGenerating] = useState(false);
    const [challenges, setChallenges] = useState<GeneratedChallenge[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(1);
    const [focusArea, setFocusArea] = useState('');
    const [contextInfo, setContextInfo] = useState<{ day: number; adaptedDifficulty: number } | null>(null);
    const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

    // Auto-redirect countdown after successful generation
    useEffect(() => {
        if (challenges.length > 0 && redirectCountdown === null) {
            setRedirectCountdown(5);
        }
    }, [challenges.length]);

    useEffect(() => {
        if (redirectCountdown !== null && redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(redirectCountdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (redirectCountdown === 0) {
            router.push('/');
            router.refresh();
        }
    }, [redirectCountdown, router]);

    const generateChallenges = async () => {
        setGenerating(true);
        setError(null);
        setChallenges([]);

        try {
            const response = await fetch('/api/challenges/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalId,
                    count,
                    focusArea: focusArea.trim() || undefined
                })
            });

            const data = await response.json();

            if (data.success) {
                setChallenges(data.data.challenges);
                if (data.data.context) {
                    setContextInfo(data.data.context);
                }
            } else {
                setError(data.error || 'Failed to generate challenges');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const getDifficultyColor = (d: number) => {
        if (d <= 3) return '#22c55e';
        if (d <= 6) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="page animate-fade-in">
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back to Dashboard
            </Link>

            <div className="page-header">
                <h1 className="heading-2">🤖 AI Challenge Generator</h1>
                <p className="text-secondary">
                    The AI creates personalized challenges based on your goals, progress, and learning patterns
                </p>
            </div>

            {/* Generation Options */}
            {challenges.length === 0 && !generating && (
                <div className="card mb-lg">
                    <h3 className="heading-4 mb-md">Generation Options</h3>

                    {/* Number of Challenges */}
                    <div className="form-group">
                        <label className="form-label">How many challenges?</label>
                        <div className="flex gap-sm">
                            {[1, 2, 3].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setCount(n)}
                                    className={`btn ${count === n ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Focus Area (Optional) */}
                    <div className="form-group">
                        <label className="form-label">Focus area (optional)</label>
                        <input
                            type="text"
                            value={focusArea}
                            onChange={e => setFocusArea(e.target.value)}
                            placeholder="e.g., 'speaking practice', 'morning routine', 'facing fears'"
                            className="form-input"
                        />
                        <p className="text-tiny text-muted mt-sm">
                            Leave empty for the AI to decide based on your journey
                        </p>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={generateChallenges}
                        className="btn btn-success w-full"
                        style={{ padding: '1rem', fontSize: '1.125rem' }}
                    >
                        🧠 Generate with AI
                    </button>
                </div>
            )}

            {/* Loading State */}
            {generating && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>
                        🧠
                    </div>
                    <h3 className="heading-4 mb-md">AI is analyzing your journey...</h3>
                    <p className="text-muted">
                        Creating personalized challenges based on your goals, progress, and learning patterns
                    </p>
                    <div className="flex flex-col gap-sm mt-lg text-left" style={{ maxWidth: '300px', margin: '1rem auto 0' }}>
                        <div className="text-small text-muted">✓ Analyzing your goal and progress</div>
                        <div className="text-small text-muted">✓ Reviewing past challenge feedback</div>
                        <div className="text-small text-muted">✓ Adapting difficulty to your level</div>
                        <div className="text-small text-muted animate-pulse">⏳ Crafting unique challenges...</div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="card mb-lg" style={{ borderLeft: '4px solid var(--color-error)' }}>
                    <p style={{ color: 'var(--color-error)' }}>{error}</p>
                    <button onClick={generateChallenges} className="btn btn-secondary mt-md">
                        Try Again
                    </button>
                </div>
            )}

            {/* Generated Challenges */}
            {challenges.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-md">
                        <h2 className="heading-4">
                            ✨ {challenges.length} Challenge{challenges.length > 1 ? 's' : ''} Created!
                        </h2>
                        {contextInfo && (
                            <span className="text-small text-muted">
                                Day {contextInfo.day} • Adapted to your level
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-md mb-lg">
                        {challenges.map((challenge, index) => (
                            <Link
                                key={challenge.id}
                                href={`/challenges/${challenge.id}`}
                                className={`card ${challenge.isRealityShift ? 'reality-shift' : ''}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div className="flex items-start gap-md">
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '12px',
                                        background: getDifficultyColor(challenge.difficulty),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1.25rem',
                                        flexShrink: 0
                                    }}>
                                        {challenge.difficulty}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="flex items-center gap-sm mb-xs">
                                            <span className="heading-5">{challenge.title}</span>
                                            {challenge.isRealityShift && (
                                                <span style={{ color: '#f12711', fontSize: '0.875rem' }}>⚡ Reality Shift</span>
                                            )}
                                        </div>
                                        <p className="text-secondary">{challenge.description}</p>
                                    </div>
                                    <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>→</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="flex gap-md">
                        <button
                            onClick={() => { setChallenges([]); setContextInfo(null); setRedirectCountdown(null); }}
                            className="btn btn-secondary"
                        >
                            Generate More
                        </button>
                        <Link href="/" onClick={() => router.refresh()} className="btn btn-primary" style={{ flex: 1 }}>
                            Go to Dashboard {redirectCountdown !== null && redirectCountdown > 0 ? `(${redirectCountdown}s)` : ''}
                        </Link>
                    </div>
                </div>
            )}

            {/* How it works */}
            {!generating && challenges.length === 0 && (
                <div className="card card-surface mt-lg">
                    <h3 className="heading-5 mb-md">🔬 How AI Generation Works</h3>
                    <ul className="text-small text-secondary" style={{ paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                        <li>Analyzes your <strong>goal</strong> and where you are in your 30-day journey</li>
                        <li>Reviews your <strong>past challenges</strong> and how difficult they felt</li>
                        <li>Checks your <strong>completion rate</strong> and adjusts difficulty accordingly</li>
                        <li>Considers your <strong>mood and energy patterns</strong> from daily check-ins</li>
                        <li>Avoids <strong>repeating recent challenges</strong> to keep things fresh</li>
                        <li>Creates <strong>unique, actionable</strong> challenges with clear success criteria</li>
                    </ul>
                </div>
            )}

            <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
        </div>
    );
}

export default function GenerateChallengesPage() {
    return (
        <Suspense fallback={<div className="page p-lg text-center">Loading generator...</div>}>
            <ChallengeGeneratorContent />
        </Suspense>
    );
}
