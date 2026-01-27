'use client';

import { useState, useEffect } from 'react';
import VoiceRecorder from '@/app/components/VoiceRecorder';
import PageHeader from '@/app/components/PageHeader';
import { Calendar, Mic, Clock, BarChart2 } from 'lucide-react';

interface DiaryEntry {
    id: string;
    transcript: string;
    audioDurationSeconds: number;
    createdAt: string;
    moodScore?: number;
    entryType: string;
    aiSummary?: string;
    aiInsights?: string;
}

export default function DiaryPage() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEntries = async () => {
        try {
            const res = await fetch('/api/diary');
            const data = await res.json();
            if (data.success) {
                setEntries(data.data.entries);
            }
        } catch (error) {
            console.error('Failed to fetch diary entries', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleSaveEntry = async (transcript: string, duration: number) => {
        try {
            const res = await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript,
                    audioDurationSeconds: duration,
                    moodScore: 7 // Placeholder mood, could be added to UI later
                })
            });

            if (res.ok) {
                await fetchEntries(); // Refresh list
            }
        } catch (error) {
            console.error('Failed to save entry', error);
            throw error;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="page" style={{ paddingBottom: '100px' }}>
            <PageHeader
                icon="📝"
                title="Voice Diary"
                subtitle="Capture your daily reflections, wins, and blockers"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                {/* Recorder Section */}
                <div className="md:col-span-2 space-y-lg">
                    <VoiceRecorder onSave={handleSaveEntry} />

                    <div className="space-y-md">
                        <h2 className="text-2xl font-bold flex items-center gap-sm">
                            <Calendar className="text-primary" />
                            Recent Entries
                        </h2>

                        {isLoading ? (
                            <div className="space-y-lg">
                                {[1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className="card-glass loading-breathe boxed-accent-top"
                                        style={{
                                            boxShadow: 'var(--shadow-md)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        {/* Header Skeleton */}
                                        <div className="flex justify-between items-center mb-md pb-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <div className="skeleton-breathe" style={{ height: '16px', width: '180px', borderRadius: 'var(--radius-sm)' }} />
                                            <div className="skeleton-breathe" style={{ height: '20px', width: '50px', borderRadius: 'var(--radius-full)' }} />
                                        </div>
                                        {/* Content Skeleton */}
                                        <div className="mb-md">
                                            <div className="skeleton-breathe" style={{ height: '20px', width: '60%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                            <div className="skeleton-breathe" style={{ height: '14px', width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-xs)' }} />
                                            <div className="skeleton-breathe" style={{ height: '14px', width: '90%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-xs)' }} />
                                            <div className="skeleton-breathe" style={{ height: '14px', width: '75%', borderRadius: 'var(--radius-sm)' }} />
                                        </div>
                                        {/* AI Analysis Skeleton */}
                                        <div className="boxed-inset loading-breathe">
                                            <div className="skeleton-breathe" style={{ height: '16px', width: '100px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                            <div className="skeleton-breathe" style={{ height: '14px', width: '80%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                            <div className="flex gap-sm">
                                                <div className="skeleton-breathe" style={{ height: '22px', width: '80px', borderRadius: 'var(--radius-full)' }} />
                                                <div className="skeleton-breathe" style={{ height: '22px', width: '60px', borderRadius: 'var(--radius-full)' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : entries.length === 0 ? (
                            <div
                                className="card-glass boxed-accent-top text-center"
                                style={{
                                    boxShadow: 'var(--shadow-md)',
                                    border: '1px solid var(--color-border)',
                                    padding: 'var(--spacing-xl)'
                                }}
                            >
                                <Mic size={48} className="mx-auto mb-md" style={{ opacity: 0.3, color: 'var(--color-text-muted)' }} />
                                <p style={{ color: 'var(--color-text-secondary)' }}>No entries yet. Start your first recording above!</p>
                            </div>
                        ) : (
                            <div className="space-y-lg">
                                {entries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="card-glass boxed-accent-top"
                                        style={{
                                            boxShadow: 'var(--shadow-md)',
                                            border: '1px solid var(--color-border)',
                                            transition: 'box-shadow var(--transition-normal), transform var(--transition-normal)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {/* Entry Header - Date & Duration grouped */}
                                        <div className="flex justify-between items-center mb-md pb-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <div className="flex items-center gap-sm text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                <Calendar size={14} style={{ color: 'var(--color-accent)' }} />
                                                <span>{formatDate(entry.createdAt)}</span>
                                            </div>
                                            {entry.audioDurationSeconds > 0 && (
                                                <div className="flex items-center gap-xs text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>
                                                    <Clock size={12} />
                                                    <span>{Math.floor(entry.audioDurationSeconds / 60)}:{(entry.audioDurationSeconds % 60).toString().padStart(2, '0')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Entry Content - Title & Transcript */}
                                        <div className="mb-md">
                                            {/* Entry Title */}
                                            {(() => {
                                                try {
                                                    const insights = JSON.parse(entry.aiInsights || '{}');
                                                    if (insights.title) {
                                                        return (
                                                            <h3 className="text-lg font-bold mb-sm" style={{ color: 'var(--color-accent)' }}>
                                                                {insights.title}
                                                            </h3>
                                                        );
                                                    }
                                                } catch (e) { }
                                                return null;
                                            })()}
                                            <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                                                {entry.transcript}
                                            </p>
                                        </div>

                                        {/* AI Analysis Section - Visually grouped */}
                                        {(entry.aiSummary || entry.aiInsights) && (
                                            <div className="boxed-inset mt-md">
                                                <div className="flex items-center gap-xs font-bold mb-sm" style={{ color: 'var(--color-accent)' }}>
                                                    <span>🧠 AI Analysis</span>
                                                </div>

                                                {entry.aiSummary && (
                                                    <p className="mb-sm italic text-sm" style={{ color: 'var(--color-text-secondary)' }}>"{entry.aiSummary}"</p>
                                                )}

                                                {entry.aiInsights && (() => {
                                                    try {
                                                        const insights = JSON.parse(entry.aiInsights);
                                                        return (
                                                            <div className="flex flex-wrap gap-sm mt-sm">
                                                                {insights.sentiment && (
                                                                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                                                        Sentiment: {insights.sentiment}
                                                                    </span>
                                                                )}
                                                                {insights.distortions?.map((d: string, i: number) => (
                                                                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                                        ⚠️ {d}
                                                                    </span>
                                                                ))}
                                                                {insights.themes?.map((t: string, i: number) => (
                                                                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(13, 148, 136, 0.1)', color: 'var(--color-accent)', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                                                                        #{t}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        );
                                                    } catch (e) { return null; }
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-md">
                    {/* Insights Header Card */}
                    <div className="card-glass boxed-accent-top">
                        <div className="flex items-center gap-sm mb-md" style={{ color: 'var(--color-accent)' }}>
                            <BarChart2 size={20} />
                            <h3 className="text-lg font-bold">Insights</h3>
                        </div>
                        <p className="text-sm mb-lg" style={{ color: 'var(--color-text-secondary)' }}>
                            Track your reflection journey and emotional patterns.
                        </p>

                        {/* Stats Grid */}
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            {/* Total Entries */}
                            <div
                                className="stat-card"
                                style={{ background: 'var(--color-surface-2)' }}
                            >
                                <div className="stat-value" style={{ color: 'var(--color-accent)', fontSize: '1.75rem' }}>
                                    {entries.length}
                                </div>
                                <div className="stat-label">Entries</div>
                            </div>

                            {/* Total Minutes */}
                            <div
                                className="stat-card"
                                style={{ background: 'var(--color-surface-2)' }}
                            >
                                <div className="stat-value" style={{ color: 'var(--color-accent)', fontSize: '1.75rem' }}>
                                    {Math.round(entries.reduce((acc, curr) => acc + (curr.audioDurationSeconds || 0), 0) / 60)}
                                </div>
                                <div className="stat-label">Minutes</div>
                            </div>

                            {/* Average Duration */}
                            <div
                                className="stat-card"
                                style={{ background: 'var(--color-surface-2)' }}
                            >
                                <div className="stat-value" style={{ color: 'var(--color-text-primary)', fontSize: '1.75rem' }}>
                                    {entries.length > 0
                                        ? Math.round(entries.reduce((acc, curr) => acc + (curr.audioDurationSeconds || 0), 0) / entries.length / 60 * 10) / 10
                                        : 0}
                                </div>
                                <div className="stat-label">Avg Min</div>
                            </div>

                            {/* This Week */}
                            <div
                                className="stat-card"
                                style={{ background: 'var(--color-surface-2)' }}
                            >
                                <div className="stat-value" style={{ color: 'var(--color-text-primary)', fontSize: '1.75rem' }}>
                                    {entries.filter(e => {
                                        const entryDate = new Date(e.createdAt);
                                        const weekAgo = new Date();
                                        weekAgo.setDate(weekAgo.getDate() - 7);
                                        return entryDate >= weekAgo;
                                    }).length}
                                </div>
                                <div className="stat-label">This Week</div>
                            </div>
                        </div>

                        {/* Mood/Sentiment Summary */}
                        {entries.length > 0 && (() => {
                            const sentiments: string[] = [];
                            entries.forEach(entry => {
                                try {
                                    const insights = JSON.parse(entry.aiInsights || '{}');
                                    if (insights.sentiment) sentiments.push(insights.sentiment);
                                } catch (e) { /* ignore */ }
                            });

                            if (sentiments.length === 0) return null;

                            const sentimentCounts = sentiments.reduce((acc, s) => {
                                acc[s] = (acc[s] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);

                            const topSentiments = Object.entries(sentimentCounts)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3);

                            if (topSentiments.length === 0) return null;

                            return (
                                <div className="mt-lg pt-md" style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <div className="text-xs uppercase tracking-wider mb-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        Top Sentiments
                                    </div>
                                    <div className="flex flex-wrap gap-sm">
                                        {topSentiments.map(([sentiment, count]) => (
                                            <span
                                                key={sentiment}
                                                className="text-xs px-2 py-1 rounded-full"
                                                style={{
                                                    background: 'rgba(13, 148, 136, 0.1)',
                                                    color: 'var(--color-accent)',
                                                    border: '1px solid rgba(13, 148, 136, 0.2)'
                                                }}
                                            >
                                                {sentiment} ({count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Common Themes */}
                        {entries.length > 0 && (() => {
                            const themes: string[] = [];
                            entries.forEach(entry => {
                                try {
                                    const insights = JSON.parse(entry.aiInsights || '{}');
                                    if (insights.themes) themes.push(...insights.themes);
                                } catch (e) { /* ignore */ }
                            });

                            if (themes.length === 0) return null;

                            const themeCounts = themes.reduce((acc, t) => {
                                acc[t] = (acc[t] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);

                            const topThemes = Object.entries(themeCounts)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5);

                            if (topThemes.length === 0) return null;

                            return (
                                <div className="mt-md pt-md" style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <div className="text-xs uppercase tracking-wider mb-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        Common Themes
                                    </div>
                                    <div className="flex flex-wrap gap-sm">
                                        {topThemes.map(([theme, count]) => (
                                            <span
                                                key={theme}
                                                className="text-xs px-2 py-1 rounded-full"
                                                style={{
                                                    background: 'var(--color-surface-2)',
                                                    color: 'var(--color-text-secondary)',
                                                    border: '1px solid var(--color-border)'
                                                }}
                                            >
                                                #{theme} ({count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

        </div>
    );
}
