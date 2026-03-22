'use client';

import PageHeader from '../components/PageHeader';
import { PillarGrid, type PillarData } from './PillarCard';
import { useProgressData } from './hooks/useProgressData';
import { ProgressCalendar } from './components/ProgressCalendar';
import { ProgressGoalBreakdown } from './components/ProgressGoalBreakdown';
import { ProgressMoodChart } from './components/ProgressMoodChart';

export type { PillarData };

export default function ProgressPage() {
    const {
        isLoading,
        error,
        selectedGoalId,
        setSelectedGoalId,
        selectedMetric,
        setSelectedMetric,
        activeGoal,
        allGoals,
        goalColorMap,
        goalStats,
        calendarData,
        monthRange,
        chartData,
        dayInJourney,
        stats,
        pillarData,
    } = useProgressData();

    return (
        <div className="page animate-fade-in">
            {error && (
                <div className="card" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-error)',
                    color: 'var(--color-error)',
                    padding: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}
            {/* Header */}
            <PageHeader
                icon={"\uD83D\uDCCA"}
                title="Your Progress"
                subtitle={activeGoal ? `Day ${dayInJourney} of your ${activeGoal.title} journey` : 'Track your transformation'}
            />

            {/* Pillars of Health - 4-Quadrant Layout with Sparklines */}
            <section className="pillar-section" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h2 className="heading-4 mb-md" style={{ color: 'var(--color-text-primary)' }}>Pillars of Health</h2>
                <PillarGrid pillars={pillarData} />
            </section>

            {/* Section Separator */}
            <hr className="section-separator-gradient" />

            {/* Stats Overview */}
            <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h2 className="heading-4 mb-md" style={{ color: 'var(--color-text-primary)' }}>Overview</h2>
                <div className="stats-grid">
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value fire">{stats.streak}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value stat-value-success">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value stat-value-accent">{stats.completionRate}%</div>
                        <div className="stat-label">Success Rate</div>
                    </div>
                    <div className="stat-card stat-card-interactive">
                        <div className="stat-value stat-value-muted">{stats.skipped}</div>
                        <div className="stat-label">Skipped</div>
                    </div>
                </div>
            </section>

            {/* Section Separator */}
            <hr className="section-separator-gradient" />

            {/* Calendar View */}
            <ProgressCalendar
                isLoading={isLoading}
                calendarData={calendarData}
                goalColorMap={goalColorMap}
                allGoals={allGoals}
                selectedGoalId={selectedGoalId}
                setSelectedGoalId={setSelectedGoalId}
                monthRange={monthRange}
            />

            {/* Goal-Specific Progress */}
            <ProgressGoalBreakdown
                goalStats={goalStats}
                goalColorMap={goalColorMap}
            />

            {/* Mood & Energy Trends Chart */}
            <ProgressMoodChart
                chartData={chartData}
                selectedMetric={selectedMetric}
                setSelectedMetric={setSelectedMetric}
            />

            {/* Visual Polish Styles */}
            <style jsx>{`
                .stat-card-interactive {
                    transition: transform var(--transition-normal),
                                box-shadow var(--transition-normal),
                                border-color var(--transition-normal);
                    border: 1px solid transparent;
                }
                .stat-card-interactive:hover {
                    transform: translateY(-3px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--color-border);
                }
                .stat-value-success {
                    color: var(--color-success);
                }
                .stat-value-accent {
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .stat-value-muted {
                    color: var(--color-text-secondary);
                }
                :global(.heading-4) {
                    position: relative;
                    display: inline-block;
                }
            `}</style>
        </div>
    );
}
