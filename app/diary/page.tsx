'use client';

import { useState, useEffect, useMemo } from 'react';
import VoiceRecorder from '@/app/components/VoiceRecorder';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Calendar, Mic, Clock, BarChart2, ChevronDown, ChevronRight } from 'lucide-react';

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

interface GroupedEntries {
    today: DiaryEntry[];
    yesterday: DiaryEntry[];
    last7Days: DiaryEntry[];
    lastMonth: DiaryEntry[];
    older: DiaryEntry[];
}

/** Normalize a theme string to title case for consistent display. */
function normalizeTheme(theme: string): string {
    const lower = theme.toLowerCase().trim();
    if (lower.length === 0) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Check if a date is today. */
function isToday(date: Date): boolean {
    const now = new Date();
    return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
}

/** Check if a date is yesterday. */
function isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getFullYear() === yesterday.getFullYear()
        && date.getMonth() === yesterday.getMonth()
        && date.getDate() === yesterday.getDate();
}

/** Check if a date is within the last N days (not including today/yesterday). */
function isWithinLastNDays(date: Date, n: number): boolean {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - n);
    cutoff.setHours(0, 0, 0, 0);
    return date >= cutoff && date < now;
}

function groupEntriesByTimeframe(entries: DiaryEntry[]): GroupedEntries {
    const groups: GroupedEntries = {
        today: [],
        yesterday: [],
        last7Days: [],
        lastMonth: [],
        older: [],
    };

    for (const entry of entries) {
        const date = new Date(entry.createdAt);
        if (isToday(date)) {
            groups.today.push(entry);
        } else if (isYesterday(date)) {
            groups.yesterday.push(entry);
        } else if (isWithinLastNDays(date, 7)) {
            groups.last7Days.push(entry);
        } else if (isWithinLastNDays(date, 30)) {
            groups.lastMonth.push(entry);
        } else {
            groups.older.push(entry);
        }
    }

    return groups;
}

/** Aggregate all themes across entries, normalized and counted. */
function aggregateThemes(entries: DiaryEntry[]): { theme: string; count: number }[] {
    const themeCounts = new Map<string, number>();

    for (const entry of entries) {
        if (!entry.aiInsights) continue;
        try {
            const insights = JSON.parse(entry.aiInsights);
            if (insights.themes && Array.isArray(insights.themes)) {
                for (const t of insights.themes) {
                    const normalized = normalizeTheme(t);
                    if (normalized) {
                        themeCounts.set(normalized, (themeCounts.get(normalized) || 0) + 1);
                    }
                }
            }
        } catch (e) { /* ignore parse errors */ }
    }

    return Array.from(themeCounts.entries())
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count);
}

/** Collapsible section for grouped diary entries. */
function EntrySection({
    title,
    entries,
    defaultExpanded,
    formatDate,
}: {
    title: string;
    entries: DiaryEntry[];
    defaultExpanded: boolean;
    formatDate: (dateString: string) => string;
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (entries.length === 0) return null;

    return (
        <div className="mb-md">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-sm w-full text-left py-sm px-sm rounded-lg hover:bg-surface-hover transition-colors"
            >
                {expanded
                    ? <ChevronDown size={18} className="text-primary" />
                    : <ChevronRight size={18} className="text-primary" />
                }
                <span className="font-bold text-base">{title}</span>
                <span className="text-muted text-sm ml-auto">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            </button>

            {expanded && (
                <div className="space-y-md mt-sm pl-sm">
                    {entries.map(entry => (
                        <DiaryEntryCard key={entry.id} entry={entry} formatDate={formatDate} />
                    ))}
                </div>
            )}
        </div>
    );
}

/** Single diary entry card. */
function DiaryEntryCard({
    entry,
    formatDate,
}: {
    entry: DiaryEntry;
    formatDate: (dateString: string) => string;
}) {
    return (
        <div className="card p-md hover:shadow-md transition-all border-l-4 border-l-primary">
            <div className="flex justify-between items-start mb-sm">
                <div className="flex items-center gap-sm text-sm text-muted">
                    <Calendar size={14} />
                    <span>{formatDate(entry.createdAt)}</span>
                </div>
                {entry.audioDurationSeconds > 0 && (
                    <div className="badge badge-neutral flex items-center gap-xs text-xs">
                        <Clock size={12} />
                        {Math.floor(entry.audioDurationSeconds / 60)}:{(entry.audioDurationSeconds % 60).toString().padStart(2, '0')}
                    </div>
                )}
            </div>
            {/* Entry Title */}
            {(() => {
                try {
                    const insights = JSON.parse(entry.aiInsights || '{}');
                    if (insights.title) {
                        return (
                            <h3 className="text-lg font-bold mb-sm text-primary">
                                {insights.title}
                            </h3>
                        );
                    }
                } catch (e) { }
                return null;
            })()}
            <p className="text-base leading-relaxed whitespace-pre-wrap mb-md">
                {entry.transcript}
            </p>

            {/* AI Analysis Section */}
            {(entry.aiSummary || entry.aiInsights) && (
                <div className="bg-surface-hover rounded-lg p-md mt-md text-sm">
                    <div className="flex items-center gap-xs font-bold text-primary mb-xs">
                        <span>AI Analysis</span>
                    </div>

                    {entry.aiSummary && (
                        <p className="mb-sm text-muted italic">&ldquo;{entry.aiSummary}&rdquo;</p>
                    )}

                    {entry.aiInsights && (() => {
                        try {
                            const insights = JSON.parse(entry.aiInsights);
                            return (
                                <div className="flex flex-wrap gap-sm mt-sm">
                                    {insights.sentiment && (
                                        <span className="badge badge-neutral">
                                            Sentiment: {insights.sentiment}
                                        </span>
                                    )}
                                    {insights.distortions?.map((d: string, i: number) => (
                                        <span key={i} className="badge badge-error bg-red-100 text-red-700 border-red-200">
                                            {d}
                                        </span>
                                    ))}
                                    {/* FB-033: Normalize themes to title case */}
                                    {insights.themes?.map((t: string, i: number) => (
                                        <span key={i} className="badge badge-primary bg-primary/10 text-primary border-primary/20">
                                            #{normalizeTheme(t)}
                                        </span>
                                    ))}
                                </div>
                            );
                        } catch (e) { return null; }
                    })()}
                </div>
            )}
        </div>
    );
}

export default function DiaryPage() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

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
                    moodScore: 7
                })
            });

            if (res.ok) {
                await fetchEntries();
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

    // FB-051: Group entries by timeframe
    const grouped = useMemo(() => groupEntriesByTimeframe(entries), [entries]);

    // FB-033: Aggregate themes case-insensitively for sidebar
    const commonThemes = useMemo(() => aggregateThemes(entries), [entries]);

    const hasRecentEntries = grouped.today.length > 0
        || grouped.yesterday.length > 0
        || grouped.last7Days.length > 0
        || grouped.lastMonth.length > 0;

    return (
        <div className="container-page max-w-4xl mx-auto p-md space-y-lg">
            <header className="mb-lg">
                <h1 className="text-4xl font-bold gradient-text mb-sm">Voice Diary</h1>
                <p className="text-muted text-lg">
                    Capture your daily reflections, wins, and blockers. Speak freely -- we handle the writing.
                </p>
            </header>

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
                            <div className="space-y-sm">
                                {/* FB-051: Timeframe-grouped sections */}
                                <EntrySection
                                    title="Today"
                                    entries={grouped.today}
                                    defaultExpanded={true}
                                    formatDate={formatDate}
                                />
                                <EntrySection
                                    title="Yesterday"
                                    entries={grouped.yesterday}
                                    defaultExpanded={true}
                                    formatDate={formatDate}
                                />
                                <EntrySection
                                    title="Last 7 Days"
                                    entries={grouped.last7Days}
                                    defaultExpanded={false}
                                    formatDate={formatDate}
                                />
                                <EntrySection
                                    title="Last Month"
                                    entries={grouped.lastMonth}
                                    defaultExpanded={false}
                                    formatDate={formatDate}
                                />

                                {/* Show All button for older entries */}
                                {grouped.older.length > 0 && !showAll && (
                                    <div className="text-center pt-md">
                                        <button
                                            onClick={() => setShowAll(true)}
                                            className="btn btn-secondary"
                                        >
                                            Show All ({grouped.older.length} older {grouped.older.length === 1 ? 'entry' : 'entries'})
                                        </button>
                                    </div>
                                )}

                                {showAll && (
                                    <EntrySection
                                        title="Older"
                                        entries={grouped.older}
                                        defaultExpanded={true}
                                        formatDate={formatDate}
                                    />
                                )}

                                {/* If all entries are older and none in recent groups */}
                                {!hasRecentEntries && !showAll && grouped.older.length === 0 && (
                                    <div className="card p-md text-center text-muted">
                                        <p>No recent entries found.</p>
                                    </div>
                                )}
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
                            Your voice diary helps track your emotional journey.
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

                    {/* FB-033: Common Themes (aggregated, case-insensitive) */}
                    {commonThemes.length > 0 && (
                        <div className="card p-md">
                            <h3 className="text-lg font-bold mb-sm">Common Themes</h3>
                            <div className="flex flex-wrap gap-sm">
                                {commonThemes.slice(0, 10).map(({ theme, count }) => (
                                    <span
                                        key={theme}
                                        className="badge badge-primary bg-primary/10 text-primary border-primary/20"
                                    >
                                        #{theme} ({count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
}
