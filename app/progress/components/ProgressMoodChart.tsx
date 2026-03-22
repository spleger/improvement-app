'use client';

import { MoodEnergyChart } from '../../../components/Charts';
import { type ChartDataPoint } from '../hooks/useProgressData';

interface ProgressMoodChartProps {
    chartData: ChartDataPoint[];
    selectedMetric: 'mood' | 'energy' | 'motivation';
    setSelectedMetric: (metric: 'mood' | 'energy' | 'motivation') => void;
}

export function ProgressMoodChart({
    chartData,
    selectedMetric,
    setSelectedMetric,
}: ProgressMoodChartProps) {
    return (
        <>
            {/* Section Separator */}
            <hr className="section-separator-gradient" />

            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
                    <h2 className="heading-4" style={{ color: 'var(--color-text-primary)' }}>Trends</h2>
                    {/* Metric Selector Tabs */}
                    <div className="flex bg-surface-2 rounded-full p-1 border border-border">
                        {(['mood', 'energy', 'motivation'] as const).map((metric) => (
                            <button
                                key={metric}
                                onClick={() => setSelectedMetric(metric)}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: selectedMetric === metric ? 'white' : 'var(--color-text-secondary)',
                                    background: selectedMetric === metric ? 'var(--color-primary)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {metric}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Chart card wrapper with responsive container styling */}
                <div
                    className="card chart-card"
                    style={{
                        minHeight: '300px',
                        height: '320px',
                        padding: 'var(--spacing-md)',
                        boxShadow: 'var(--shadow-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        willChange: 'box-shadow, transform'
                    }}
                >
                    <MoodEnergyChart data={chartData} visibleMetrics={[selectedMetric]} />
                </div>
            </section>
            <style jsx>{`
                .chart-card {
                    transition: box-shadow var(--transition-normal),
                                transform var(--transition-normal);
                }
                .chart-card:hover {
                    box-shadow: var(--shadow-lg);
                }
            `}</style>
        </>
    );
}
