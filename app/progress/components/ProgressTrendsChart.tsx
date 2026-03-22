'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
    date: string;
    mood: number;
    energy: number;
    motivation: number;
}

type Timeframe = '7d' | '30d' | 'all';
type Metric = 'mood' | 'energy' | 'motivation' | 'all';

const TIMEFRAME_OPTIONS: { key: Timeframe; label: string }[] = [
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last month' },
    { key: 'all', label: 'All time' },
];

const METRIC_OPTIONS: { key: Metric; label: string; color: string }[] = [
    { key: 'mood', label: 'Mood', color: '#14b8a6' },
    { key: 'energy', label: 'Energy', color: '#3b82f6' },
    { key: 'motivation', label: 'Motivation', color: '#f97316' },
    { key: 'all', label: 'All', color: '#14b8a6' },
];

export default function ProgressTrendsChart({ data }: { data: DataPoint[] }) {
    const [timeframe, setTimeframe] = useState<Timeframe>('7d');
    const [activeMetric, setActiveMetric] = useState<Metric>('mood');

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Sort data by date ascending
        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

        switch (timeframe) {
            case '7d':
                return sorted.slice(-7);
            case '30d':
                return sorted.slice(-30);
            case 'all':
            default:
                return sorted;
        }
    }, [data, timeframe]);

    const chartData = useMemo(() => {
        return filteredData.map(d => ({
            ...d,
            // Format date for display
            label: formatDateLabel(d.date, timeframe),
        }));
    }, [filteredData, timeframe]);

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="card">
            {/* Timeframe selector pills */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '1.25rem',
            }}>
                {TIMEFRAME_OPTIONS.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setTimeframe(opt.key)}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                            background: timeframe === opt.key ? '#14b8a6' : 'var(--color-surface)',
                            color: timeframe === opt.key ? '#000000' : 'var(--color-text-secondary)',
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <YAxis
                            domain={[1, 10]}
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                            }}
                            labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
                        />
                        {(activeMetric === 'mood' || activeMetric === 'all') && (
                            <Line
                                type="monotone"
                                dataKey="mood"
                                stroke="#14b8a6"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#14b8a6' }}
                                activeDot={{ r: 5 }}
                                name="Mood"
                            />
                        )}
                        {(activeMetric === 'energy' || activeMetric === 'all') && (
                            <Line
                                type="monotone"
                                dataKey="energy"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#3b82f6' }}
                                activeDot={{ r: 5 }}
                                name="Energy"
                            />
                        )}
                        {(activeMetric === 'motivation' || activeMetric === 'all') && (
                            <Line
                                type="monotone"
                                dataKey="motivation"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#f97316' }}
                                activeDot={{ r: 5 }}
                                name="Motivation"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Clickable legend */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
            }}>
                {METRIC_OPTIONS.map(opt => {
                    const isActive = activeMetric === opt.key;
                    return (
                        <button
                            key={opt.key}
                            onClick={() => setActiveMetric(opt.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '0.813rem',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                                background: 'transparent',
                                color: isActive ? opt.color : 'var(--color-text-muted)',
                                opacity: isActive ? 1 : 0.6,
                            }}
                        >
                            {opt.key !== 'all' && (
                                <span style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: isActive ? opt.color : 'var(--color-text-muted)',
                                    display: 'inline-block',
                                }} />
                            )}
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function formatDateLabel(dateStr: string, timeframe: Timeframe): string {
    const date = new Date(dateStr + 'T00:00:00');
    if (timeframe === '7d') {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
