'use client';

import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ChartData {
    date: string;
    mood: number;
    energy: number;
    motivation: number;
}

interface MoodEnergyChartProps {
    data: ChartData[];
}

// Custom tooltip component for better styling
const CustomTooltip = ({
    active,
    payload,
    label
}: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}) => {
    if (active && payload && payload.length) {
        const formattedDate = label ? new Date(label).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }) : '';

        return (
            <div style={{
                background: 'var(--color-surface-solid, #1e1e28)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: 'var(--spacing-md, 1rem)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <p style={{
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--color-text-primary)'
                }}>
                    {formattedDate}
                </p>
                {payload.map((entry, index) => (
                    <p key={index} style={{
                        color: entry.color,
                        fontSize: '0.875rem',
                        margin: '4px 0'
                    }}>
                        {entry.name}: {entry.value}/10
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// MiniStatChart - Sparkline-style mini chart for pillar cards
interface MiniStatChartProps {
    data: Array<{ value: number; date?: string }>;
    color?: string;
    height?: number;
    showGradient?: boolean;
}

export function MiniStatChart({
    data,
    color = '#0d9488',
    height = 40,
    showGradient = true,
}: MiniStatChartProps) {
    // Don't render if no data
    if (!data || data.length === 0) {
        return (
            <div
                style={{
                    width: '100%',
                    height: `${height}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <span
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    No data
                </span>
            </div>
        );
    }

    // Generate unique gradient ID to avoid conflicts when multiple charts on page
    const gradientId = `miniStatGradient-${color.replace('#', '')}`;

    return (
        <div style={{ width: '100%', height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                >
                    {showGradient && (
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                    )}
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={showGradient ? `url(#${gradientId})` : 'transparent'}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={true}
                        animationDuration={500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function MoodEnergyChart({ data }: MoodEnergyChartProps) {
    // Empty state handling - show message when no survey data exists
    if (!data || data.length === 0) {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '250px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                }}
            >
                <span
                    style={{
                        fontSize: '2rem',
                        opacity: 0.3,
                    }}
                >
                    📊
                </span>
                <span
                    style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)',
                        textAlign: 'center',
                    }}
                >
                    No survey data yet. Complete your first daily check-in to see trends!
                </span>
            </div>
        );
    }

    // Format dates for display on X-axis
    const formattedData = data.map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }));

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={formattedData}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 10,
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        opacity={0.5}
                    />
                    <XAxis
                        dataKey="displayDate"
                        tick={{
                            fill: 'var(--color-text-muted)',
                            fontSize: 11
                        }}
                        tickLine={{ stroke: 'var(--color-border)' }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={[0, 10]}
                        tick={{
                            fill: 'var(--color-text-muted)',
                            fontSize: 11
                        }}
                        tickLine={{ stroke: 'var(--color-border)' }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickCount={6}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '16px',
                            fontSize: '12px'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="mood"
                        name="Mood"
                        stroke="#667eea"
                        strokeWidth={2}
                        dot={{ fill: '#667eea', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="energy"
                        name="Energy"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="motivation"
                        name="Motivation"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default MoodEnergyChart;
