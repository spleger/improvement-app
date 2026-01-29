'use client';

import {
    LineChart,
    Line,
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

export function MoodEnergyChart({ data }: MoodEnergyChartProps) {
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
