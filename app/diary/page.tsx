'use client';

import { useState, useEffect } from 'react';
import VoiceRecorder from '@/app/components/VoiceRecorder';
import BottomNavigation from '@/app/components/BottomNavigation';
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
                            <div className="flex justify-center p-xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="card p-xl text-center text-muted">
                                <Mic size={48} className="mx-auto mb-md opacity-20" />
                                <p>No entries yet. Start your first recording above!</p>
                            </div>
                        ) : (
                            <div className="space-y-md">
                                {entries.map(entry => (
                                    <div key={entry.id} className="card-glass boxed-accent-top">
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
                    <div className="card p-md bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                        <h3 className="text-lg font-bold mb-sm flex items-center gap-sm">
                            <BarChart2 size={20} />
                            Insights
                        </h3>
                        <p className="text-sm text-muted mb-md">
                            Your voice diary helps track your emotional journey. AI insights coming soon!
                        </p>
                        <div className="flex items-center gap-md">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{entries.length}</div>
                                <div className="text-xs text-muted uppercase tracking-wider">Entries</div>
                            </div>
                            <div className="w-px h-8 bg-border"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">
                                    {Math.round(entries.reduce((acc, curr) => acc + (curr.audioDurationSeconds || 0), 0) / 60)}
                                </div>
                                <div className="text-xs text-muted uppercase tracking-wider">Minutes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
}
