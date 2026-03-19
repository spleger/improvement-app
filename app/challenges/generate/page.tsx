'use client';

import { useState, useEffect, useRef } from 'react';
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
    const [streamProgress, setStreamProgress] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Auto-redirect countdown after generation completes (not during streaming)
    useEffect(() => {
        if (!generating && challenges.length > 0 && redirectCountdown === null) {
            setRedirectCountdown(5);
        }
    }, [challenges.length, generating]);

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
        setStreamProgress(null);
        setRedirectCountdown(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch('/api/challenges/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    goalId,
                    count,
                    focusArea: focusArea.trim() || undefined
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to generate challenges');
                setGenerating(false);
                return;
            }

            const contentType = response.headers.get('Content-Type') || '';

            if (contentType.includes('text/event-stream') && response.body) {
                // SSE streaming path
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let receivedCount = 0;

                setStreamProgress(`Generating challenge 1 of ${count}...`);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Parse SSE events from buffer
                    const lines = buffer.split('\n\n');
                    // Keep the last incomplete chunk in the buffer
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) continue;

                        try {
                            const payload = JSON.parse(trimmed.slice(6));

                            if (payload.type === 'challenge') {
                                receivedCount++;
                                setChallenges(prev => [...prev, payload.data]);
                                if (receivedCount < count) {
                                    setStreamProgress(`Generating challenge ${receivedCount + 1} of ${count}...`);
                                } else {
                                    setStreamProgress(null);
                                }
                            } else if (payload.type === 'done') {
                                if (payload.context) {
                                    setContextInfo(payload.context);
                                }
                                setStreamProgress(null);
                            } else if (payload.type === 'error') {
                                setError(payload.error || 'Failed to generate challenges');
                            }
                        } catch {
                            // Skip malformed JSON lines
                        }
                    }
                }
            } else {
                // Fallback: JSON response (for non-streaming responses)
                const data = await response.json();
                if (data.success) {
                    setChallenges(data.data.challenges);
                    if (data.data.context) {
                        setContextInfo(data.data.context);
                    }
                } else {
                    setError(data.error || 'Failed to generate challenges');
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError('Network error. Please try again.');
            }
        } finally {
            setGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const getDifficultyColor = (d: number) => {
        if (d <= 3) return '#22c55e';
        if (d <= 6) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="page animate-fade-in" style={{ paddingBottom: '100px' }}>
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back to Dashboard
            </Link>

            <div className="page-header">
                <h1 className="heading-2">AI Challenge Generator</h1>
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
                        Generate with AI
                    </button>
                </div>
            )}

            {/* Loading State (shown while streaming, before any challenges arrive) */}
            {generating && challenges.length === 0 && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                        <span className="animate-pulse" style={{ display: 'inline-block' }}>...</span>
                    </div>
                    <h3 className="heading-4 mb-md">AI is analyzing your journey</h3>
                    <p className="text-muted">
                        {streamProgress || 'Creating personalized challenges based on your goals, progress, and learning patterns'}
                    </p>
                </div>
            )}

            {/* Streaming progress indicator (shown alongside challenges as they arrive) */}
            {generating && challenges.length > 0 && streamProgress && (
                <div className="card mb-md text-center" style={{ padding: '1rem' }}>
                    <p className="text-secondary animate-pulse">{streamProgress}</p>
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

            {/* Generated Challenges (shown incrementally as they stream in) */}
            {challenges.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-md">
                        <h2 className="heading-4">
                            {challenges.length} Challenge{challenges.length > 1 ? 's' : ''} Created{generating ? '...' : '!'}
                        </h2>
                        {contextInfo && (
                            <span className="text-small text-muted">
                                Day {contextInfo.day} -- Adapted to your level
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-md mb-lg">
                        {challenges.map((challenge, index) => (
                            <Link
                                key={challenge.id}
                                href={`/challenges/${challenge.id}`}
                                className={`card ${challenge.isRealityShift ? 'reality-shift' : ''} animate-fade-in`}
                                style={{
                                    textDecoration: 'none',
                                    animationDelay: `${index * 100}ms`,
                                    animationFillMode: 'both',
                                }}
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
                                                <span style={{ color: '#f12711', fontSize: '0.875rem' }}>Reality Shift</span>
                                            )}
                                        </div>
                                        <p className="text-secondary">{challenge.description}</p>
                                    </div>
                                    <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>&rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Action buttons only shown after generation completes */}
                    {!generating && (
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
                    )}
                </div>
            )}

            {/* How it works */}
            {!generating && challenges.length === 0 && (
                <div className="card card-surface mt-lg">
                    <h3 className="heading-5 mb-md">How AI Generation Works</h3>
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
