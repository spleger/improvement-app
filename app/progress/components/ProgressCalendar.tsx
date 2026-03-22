'use client';

import { type CalendarDay, type Goal, GOAL_COLORS, CALENDAR_MIN_HEIGHT } from '../hooks/useProgressData';

interface ProgressCalendarProps {
    isLoading: boolean;
    calendarData: CalendarDay[];
    goalColorMap: Map<string | null, number>;
    allGoals: Goal[];
    selectedGoalId: string | 'all';
    setSelectedGoalId: (id: string | 'all') => void;
    monthRange: string;
}

export function ProgressCalendar({
    isLoading,
    calendarData,
    goalColorMap,
    allGoals,
    selectedGoalId,
    setSelectedGoalId,
    monthRange,
}: ProgressCalendarProps) {
    return (
        <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
                <div className="flex items-center gap-md">
                    <h2 className="heading-4" style={{ color: 'var(--color-text-primary)' }}>Last 30 Days</h2>
                    {/* Goal Selector */}
                    <div className="relative">
                        <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            style={{
                                appearance: 'none',
                                background: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-full)',
                                padding: '6px 32px 6px 16px',
                                fontSize: '0.875rem',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                outline: 'none',
                                fontWeight: 500,
                                maxWidth: '200px',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            <option value="all">All Goals</option>
                            {allGoals.map(goal => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.title}
                                </option>
                            ))}
                        </select>
                        {/* Custom arrow icon */}
                        <div style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.7rem'
                        }}>
                            &#x25BC;
                        </div>
                    </div>
                </div>
                <span className="text-tiny text-muted">{monthRange}</span>
            </div>
            <div
                className={`card calendar-card ${isLoading ? 'loading-breathe' : ''}`}
                style={{
                    minHeight: `${CALENDAR_MIN_HEIGHT}px`,
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'box-shadow var(--transition-normal), transform var(--transition-normal)'
                }}
            >
                {isLoading ? (
                    /* Calendar Skeleton Loading State */
                    <div style={{ minHeight: `${CALENDAR_MIN_HEIGHT - 40}px` }}>
                        {/* Weekday headers skeleton */}
                        <div className="calendar-grid" style={{ marginBottom: 'var(--spacing-sm)' }}>
                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div
                                    key={i}
                                    className="skeleton-breathe"
                                    style={{
                                        height: '16px',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                />
                            ))}
                        </div>
                        {/* Calendar cells skeleton - 6 rows for calendar grid */}
                        <div className="calendar-grid">
                            {Array.from({ length: 42 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="skeleton-breathe"
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        minHeight: '28px',
                                        maxHeight: '44px',
                                        borderRadius: '6px'
                                    }}
                                />
                            ))}
                        </div>
                        {/* Legend skeleton */}
                        <div className="flex flex-wrap justify-center gap-md mt-md">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className="skeleton-breathe"
                                    style={{
                                        width: '80px',
                                        height: '16px',
                                        borderRadius: 'var(--radius-full)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Actual Calendar Content */
                    <>
                        <div
                            className="calendar-grid"
                            style={{
                                minHeight: `${CALENDAR_MIN_HEIGHT - 100}px`
                            }}
                        >
                            {/* Weekday headers */}
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                <div key={i} className="text-tiny text-muted text-center" style={{
                                    padding: '4px',
                                    fontWeight: 500,
                                    height: '24px'
                                }}>
                                    {day}
                                </div>
                            ))}
                            {/* Calendar cells */}
                            {calendarData.map((day, i) => {
                                const goalColorIndex = day.goalId ? goalColorMap.get(day.goalId) ?? 0 : -1;
                                const goalColor = goalColorIndex >= 0 ? GOAL_COLORS[goalColorIndex] : null;

                                const getBackground = () => {
                                    if (day.status === 'completed' && goalColor) {
                                        return goalColor.bg;
                                    }
                                    if (day.status === 'completed') {
                                        return 'var(--gradient-success)';
                                    }
                                    if (day.status === 'skipped') {
                                        return 'var(--color-error)';
                                    }
                                    if (day.status === 'pending') {
                                        return 'var(--color-warning)';
                                    }
                                    return 'var(--color-surface)';
                                };

                                const isToday = day.date === new Date().toISOString().split('T')[0];
                                const hasActivity = ['completed', 'skipped', 'pending'].includes(day.status);

                                return (
                                    <div
                                        key={i}
                                        className={`calendar-cell ${hasActivity ? 'calendar-cell-active' : ''} ${isToday ? 'calendar-cell-today' : ''}`}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            minHeight: '28px',
                                            maxHeight: '44px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
                                            gap: '1px',
                                            visibility: day.isEmpty ? 'hidden' : 'visible',
                                            background: getBackground(),
                                            color: ['completed', 'skipped'].includes(day.status) ? 'white' : 'var(--color-text-secondary)',
                                            border: isToday
                                                ? '2px solid var(--color-accent)'
                                                : 'none',
                                            position: 'relative',
                                            cursor: hasActivity ? 'pointer' : 'default'
                                        }}
                                        title={day.date ? `${day.date}: ${day.status}${day.goalTitle ? ` (${day.goalTitle})` : ''}` : ''}
                                    >
                                        {/* Month indicator label */}
                                        {day.monthLabel && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '1px',
                                                left: '1px',
                                                fontSize: 'clamp(0.4rem, 1.2vw, 0.5rem)',
                                                fontWeight: 600,
                                                lineHeight: 1,
                                                color: ['completed', 'skipped'].includes(day.status) ? 'rgba(255,255,255,0.9)' : 'var(--color-accent)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.02em'
                                            }}>
                                                {day.monthLabel}
                                            </span>
                                        )}
                                        {/* Goal indicator dot */}
                                        {day.goalId && day.status !== 'none' && goalColor && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '2px',
                                                right: '2px',
                                                width: '5px',
                                                height: '5px',
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.8)',
                                                border: `1px solid ${goalColor.border}`
                                            }} />
                                        )}
                                        {/* Date label */}
                                        <span style={{
                                            fontSize: 'clamp(0.55rem, 1.8vw, 0.7rem)',
                                            fontWeight: 600,
                                            lineHeight: 1,
                                            marginTop: day.monthLabel ? '4px' : '0'
                                        }}>
                                            {day.dayOfMonth || ''}
                                        </span>
                                        {/* Status icon */}
                                        <span style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.65rem)', lineHeight: 1 }}>
                                            {day.status === 'completed' && '\u2713'}
                                            {day.status === 'skipped' && '\u2717'}
                                            {day.status === 'pending' && '\u25CB'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Status Legend */}
                        <div className="flex flex-wrap justify-center gap-md mt-md text-tiny" style={{ paddingTop: 'var(--spacing-sm)' }}>
                            <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--gradient-success)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                <span style={{ color: 'var(--color-text-secondary)' }}>Completed</span>
                            </span>
                            <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--color-error)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                <span style={{ color: 'var(--color-text-secondary)' }}>Skipped</span>
                            </span>
                            <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--color-warning)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                <span style={{ color: 'var(--color-text-secondary)' }}>Pending</span>
                            </span>
                            <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }} />
                                <span style={{ color: 'var(--color-text-secondary)' }}>No challenge</span>
                            </span>
                            <span className="flex items-center gap-sm legend-item" style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 4, border: '2px solid var(--color-accent)', boxShadow: '0 0 4px rgba(13, 148, 136, 0.3)' }} />
                                <span style={{ color: 'var(--color-text-secondary)' }}>Today</span>
                            </span>
                        </div>

                        {/* Goal Colors Legend (only if multiple goals and showing all) */}
                        {allGoals.length > 1 && selectedGoalId === 'all' && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                                <div className="text-tiny text-muted text-center mb-sm">Goal Colors</div>
                                <div className="flex flex-wrap justify-center gap-md text-tiny">
                                    {allGoals.map((goal, index) => {
                                        const colorIndex = index % GOAL_COLORS.length;
                                        const color = GOAL_COLORS[colorIndex];
                                        return (
                                            <span key={goal.id} className="flex items-center gap-sm">
                                                <span style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 3,
                                                    background: color.bg
                                                }} />
                                                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {goal.title}
                                                </span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <style jsx>{`
                .calendar-cell {
                    transition: transform var(--transition-fast),
                                box-shadow var(--transition-fast),
                                filter var(--transition-fast),
                                opacity var(--transition-fast);
                }
                .calendar-cell:hover {
                    transform: scale(1.08);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10;
                }
                .calendar-cell-active:hover {
                    transform: scale(1.12);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                    filter: brightness(1.1);
                }
                .calendar-cell-today {
                    box-shadow: 0 0 0 2px var(--color-accent), 0 2px 8px rgba(13, 148, 136, 0.3);
                }
                .calendar-cell-today:hover {
                    box-shadow: 0 0 0 2px var(--color-accent), 0 6px 16px rgba(13, 148, 136, 0.4);
                }
                .calendar-card:hover {
                    box-shadow: var(--shadow-lg);
                }
                .legend-item:hover {
                    background: var(--color-surface-hover);
                }
            `}</style>
        </section>
    );
}
