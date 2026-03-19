'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';

interface DigestRawData {
    challengesCompleted: number;
    challengesSkipped: number;
    avgMood: number | null;
    avgEnergy: number | null;
    avgMotivation: number | null;
    moodTrend: string;
    habitCompletionRate: number;
    streak: number;
    diaryCount: number;
    commonThemes: string[];
    bestHabit: string | null;
    worstHabit: string | null;
    activeGoalTitles: string[];
    avgDifficulty: number | null;
    avgSatisfaction: number | null;
}

interface DigestData {
    id: string;
    weekStartDate: string;
    weekEndDate: string;
    aiSummary: string;
    topAchievement: string | null;
    focusArea: string | null;
    suggestion: string | null;
    rawData: DigestRawData;
    createdAt: string;
    cached: boolean;
}

function formatWeekDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function getWeekStartForOffset(offset: number): string {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - mondayOffset);
    thisMonday.setUTCDate(thisMonday.getUTCDate() + offset * 7);
    return thisMonday.toISOString().split('T')[0];
}

export default function DigestPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [digest, setDigest] = useState<DigestData | null>(null);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

    const fetchDigest = useCallback(async (offset: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const weekStart = getWeekStartForOffset(offset);
            const res = await fetch(`/api/digest/weekly?weekStart=${weekStart}`);
            const result = await res.json();
            if (result.success) {
                setDigest(result.data);
            } else {
                setError(result.error || 'Failed to load digest');
            }
        } catch {
            setError('Failed to load weekly digest');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDigest(weekOffset);
    }, [weekOffset, fetchDigest]);

    const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
    const goToNextWeek = () => {
        if (weekOffset < 0) setWeekOffset(prev => prev + 1);
    };

    return (
        <div className="page animate-fade-in">
            <PageHeader
                icon="[W]"
                title="Weekly Digest"
                subtitle="Your AI-powered weekly progress review"
            />

            {/* Week Navigation */}
            <div className="card-glass mb-lg" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
            }}>
                <button
                    onClick={goToPreviousWeek}
                    className="btn btn-ghost"
                    style={{ minWidth: '44px', minHeight: '44px', fontSize: '1.25rem' }}
                    aria-label="Previous week"
                >
                    &lt;
                </button>
                <div style={{ textAlign: 'center' }}>
                    {digest ? (
                        <>
                            <div className="heading-5">
                                {formatWeekDate(digest.weekStartDate)} - {formatWeekDate(digest.weekEndDate)}
                            </div>
                            <div className="text-small text-muted">
                                {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ago`}
                            </div>
                        </>
                    ) : (
                        <div className="text-muted">
                            {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ago`}
                        </div>
                    )}
                </div>
                <button
                    onClick={goToNextWeek}
                    className="btn btn-ghost"
                    style={{
                        minWidth: '44px',
                        minHeight: '44px',
                        fontSize: '1.25rem',
                        opacity: weekOffset >= 0 ? 0.3 : 1,
                    }}
                    disabled={weekOffset >= 0}
                    aria-label="Next week"
                >
                    &gt;
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="card-glass mb-lg" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="heading-5 mb-sm">Generating your weekly digest...</div>
                    <div className="text-muted text-small">Analyzing your activity and creating insights</div>
                    <div style={{
                        margin: '1.5rem auto 0',
                        width: '48px',
                        height: '48px',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTopColor: 'var(--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="card-glass mb-lg" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div className="heading-5 mb-sm" style={{ color: 'var(--color-error, #ef4444)' }}>
                        Could not load digest
                    </div>
                    <p className="text-muted text-small mb-md">{error}</p>
                    <button
                        onClick={() => fetchDigest(weekOffset)}
                        className="btn btn-primary"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Digest Content */}
            {digest && !isLoading && !error && (
                <>
                    {/* AI Summary */}
                    <div className="card-glass mb-lg">
                        <div className="flex items-center gap-sm mb-md">
                            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>[AI]</span>
                            <span className="heading-5">Weekly Summary</span>
                        </div>
                        <p style={{
                            lineHeight: 1.7,
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.95rem',
                        }}>
                            {digest.aiSummary}
                        </p>
                    </div>

                    {/* Achievement, Focus, Suggestion Cards */}
                    <div className="flex flex-col gap-md mb-lg">
                        {digest.topAchievement && (
                            <div className="card-glass" style={{
                                borderLeft: '4px solid #22c55e',
                            }}>
                                <div className="text-small" style={{
                                    color: '#22c55e',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.5rem',
                                }}>
                                    Top Achievement
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                                    {digest.topAchievement}
                                </p>
                            </div>
                        )}

                        {digest.focusArea && (
                            <div className="card-glass" style={{
                                borderLeft: '4px solid #f59e0b',
                            }}>
                                <div className="text-small" style={{
                                    color: '#f59e0b',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.5rem',
                                }}>
                                    Focus Area
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                                    {digest.focusArea}
                                </p>
                            </div>
                        )}

                        {digest.suggestion && (
                            <div className="card-glass" style={{
                                borderLeft: '4px solid var(--color-primary)',
                            }}>
                                <div className="text-small" style={{
                                    color: 'var(--color-primary)',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.5rem',
                                }}>
                                    Suggestion for Next Week
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                                    {digest.suggestion}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="card-glass mb-lg">
                        <div className="heading-5 mb-md">Week at a Glance</div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#22c55e' }}>
                                    {digest.rawData.challengesCompleted}
                                </div>
                                <div className="stat-label">Completed</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                                    {digest.rawData.habitCompletionRate}%
                                </div>
                                <div className="stat-label">Habit Rate</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">
                                    {digest.rawData.avgMood ?? '--'}
                                </div>
                                <div className="stat-label">Avg Mood</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value fire">
                                    {digest.rawData.streak}
                                </div>
                                <div className="stat-label">Streak</div>
                            </div>
                        </div>

                        {/* Additional stats row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.75rem',
                            marginTop: '1rem',
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                            }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                    {digest.rawData.avgEnergy ?? '--'}
                                </div>
                                <div className="text-small text-muted">Energy</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                            }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                    {digest.rawData.avgMotivation ?? '--'}
                                </div>
                                <div className="text-small text-muted">Motivation</div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                            }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                    {digest.rawData.diaryCount}
                                </div>
                                <div className="text-small text-muted">Diary Entries</div>
                            </div>
                        </div>

                        {/* Mood trend indicator */}
                        {digest.rawData.moodTrend && digest.rawData.moodTrend !== 'stable' && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                background: digest.rawData.moodTrend === 'improving'
                                    ? 'rgba(34, 197, 94, 0.1)'
                                    : 'rgba(239, 68, 68, 0.1)',
                                color: digest.rawData.moodTrend === 'improving' ? '#22c55e' : '#ef4444',
                                fontSize: '0.85rem',
                                textAlign: 'center',
                            }}>
                                Mood trend: {digest.rawData.moodTrend === 'improving' ? 'Trending up' : 'Trending down'}
                            </div>
                        )}

                        {/* Common themes */}
                        {digest.rawData.commonThemes && digest.rawData.commonThemes.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <div className="text-small text-muted" style={{ marginBottom: '0.5rem' }}>
                                    Common Themes
                                </div>
                                <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                                    {digest.rawData.commonThemes.map((theme, i) => (
                                        <span key={i} style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            background: 'rgba(139, 92, 246, 0.15)',
                                            color: '#a78bfa',
                                            fontSize: '0.8rem',
                                        }}>
                                            {theme}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Link */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <Link href="/" className="btn btn-ghost text-small">
                            Back to Dashboard
                        </Link>
                    </div>
                </>
            )}

            {/* Spinner animation */}
            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
