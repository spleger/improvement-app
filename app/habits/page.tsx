'use client';

import { useState, useEffect } from 'react';
import { Plus, Mic, CheckCircle2, Circle, ChevronRight, Flame, MoreVertical, Trash2, Edit2, X, Target } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import CreateHabitModal from './CreateHabitModal';
import HabitVoiceLogger from './HabitVoiceLogger';

interface Habit {
    id: string;
    name: string;
    description?: string;
    icon: string;
    frequency: string;
    goalId?: string;
    goalTitle?: string;
    completedToday: boolean;
    todayNotes?: string;
    streak: number;
}

export default function HabitsPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showVoiceLogger, setShowVoiceLogger] = useState(false);
    const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
    const [noteInputs, setNoteInputs] = useState<{ [key: string]: string }>({});
    const [savingHabitId, setSavingHabitId] = useState<string | null>(null);

    const fetchHabits = async () => {
        try {
            const res = await fetch('/api/habits');
            const data = await res.json();
            if (data.success) {
                setHabits(data.data.habits);
                // Initialize note inputs
                const notes: { [key: string]: string } = {};
                data.data.habits.forEach((h: Habit) => {
                    notes[h.id] = h.todayNotes || '';
                });
                setNoteInputs(notes);
            }
        } catch (error) {
            console.error('Failed to fetch habits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHabits();
    }, []);

    const toggleHabit = async (habitId: string, currentStatus: boolean) => {
        setSavingHabitId(habitId);
        try {
            const res = await fetch('/api/habits/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    habitId,
                    completed: !currentStatus,
                    notes: noteInputs[habitId] || null,
                    source: 'manual'
                })
            });

            if (res.ok) {
                setHabits(prev => prev.map(h =>
                    h.id === habitId
                        ? { ...h, completedToday: !currentStatus }
                        : h
                ));
            }
        } catch (error) {
            console.error('Failed to toggle habit:', error);
        } finally {
            setSavingHabitId(null);
        }
    };

    const saveNote = async (habitId: string) => {
        setSavingHabitId(habitId);
        try {
            const habit = habits.find(h => h.id === habitId);
            await fetch('/api/habits/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    habitId,
                    completed: habit?.completedToday || false,
                    notes: noteInputs[habitId],
                    source: 'manual'
                })
            });
            setExpandedHabitId(null);
        } catch (error) {
            console.error('Failed to save note:', error);
        } finally {
            setSavingHabitId(null);
        }
    };

    const deleteHabit = async (habitId: string) => {
        if (!confirm('Delete this habit? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/habits?id=${habitId}`, { method: 'DELETE' });
            if (res.ok) {
                setHabits(prev => prev.filter(h => h.id !== habitId));
            }
        } catch (error) {
            console.error('Failed to delete habit:', error);
        }
    };

    const completedCount = habits.filter(h => h.completedToday).length;
    const totalCount = habits.length;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Get last 7 days for mini calendar
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="habits-page">
            {/* Header */}
            <header className="habits-header">
                <div>
                    <h1>Habits</h1>
                    <p className="habits-subtitle">Build consistency, one day at a time</p>
                </div>
                <button
                    className="voice-log-btn"
                    onClick={() => setShowVoiceLogger(true)}
                >
                    <Mic size={20} />
                    <span>Voice Log</span>
                </button>
            </header>

            {/* Progress Summary */}
            <div className="habits-summary">
                <div className="summary-ring">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path
                            className="circle-bg"
                            d="M18 2.0845
                               a 15.9155 15.9155 0 0 1 0 31.831
                               a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="circle-progress"
                            strokeDasharray={`${completionPercent}, 100`}
                            d="M18 2.0845
                               a 15.9155 15.9155 0 0 1 0 31.831
                               a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="summary-text">
                        <span className="summary-number">{completedCount}/{totalCount}</span>
                        <span className="summary-label">Today</span>
                    </div>
                </div>
                <div className="mini-calendar">
                    {last7Days.map((day, i) => (
                        <div key={i} className="calendar-day">
                            <span className="day-name">{dayNames[day.getDay()]}</span>
                            <span className={`day-dot ${i === 6 ? 'today' : ''}`}></span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Habits List */}
            <div className="habits-list">
                {loading ? (
                    <div className="loading-state">Loading habits...</div>
                ) : habits.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✅</div>
                        <h3>No habits yet</h3>
                        <p>Start building your daily routine</p>
                        <button
                            className="btn-primary-gradient"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus size={18} />
                            Create First Habit
                        </button>
                    </div>
                ) : (
                    habits.map(habit => (
                        <div
                            key={habit.id}
                            className={`habit-card ${habit.completedToday ? 'completed' : ''} ${expandedHabitId === habit.id ? 'expanded' : ''}`}
                        >
                            <div className="habit-main">
                                <button
                                    className={`habit-toggle ${savingHabitId === habit.id ? 'saving' : ''}`}
                                    onClick={() => toggleHabit(habit.id, habit.completedToday)}
                                    disabled={savingHabitId === habit.id}
                                >
                                    {habit.completedToday ? (
                                        <CheckCircle2 size={28} className="check-icon" />
                                    ) : (
                                        <Circle size={28} className="circle-icon" />
                                    )}
                                </button>

                                <div className="habit-info" onClick={() => setExpandedHabitId(expandedHabitId === habit.id ? null : habit.id)}>
                                    <div className="habit-name-row">
                                        <span className="habit-icon">{habit.icon}</span>
                                        <span className="habit-name">{habit.name}</span>
                                        {habit.streak > 0 && (
                                            <span className="habit-streak">
                                                <Flame size={14} />
                                                {habit.streak}
                                            </span>
                                        )}
                                    </div>
                                    {habit.goalTitle && (
                                        <div className="habit-goal">
                                            <Target size={12} />
                                            {habit.goalTitle}
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="habit-expand"
                                    onClick={() => setExpandedHabitId(expandedHabitId === habit.id ? null : habit.id)}
                                >
                                    <ChevronRight size={20} className={expandedHabitId === habit.id ? 'rotated' : ''} />
                                </button>
                            </div>

                            {expandedHabitId === habit.id && (
                                <div className="habit-details">
                                    <div className="note-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Add a note... (optional)"
                                            value={noteInputs[habit.id] || ''}
                                            onChange={(e) => setNoteInputs(prev => ({ ...prev, [habit.id]: e.target.value }))}
                                            className="note-input"
                                        />
                                        {noteInputs[habit.id] && (
                                            <button
                                                className="save-note-btn"
                                                onClick={() => saveNote(habit.id)}
                                                disabled={savingHabitId === habit.id}
                                            >
                                                Save
                                            </button>
                                        )}
                                    </div>
                                    <div className="habit-actions">
                                        <button className="habit-action-btn" onClick={() => deleteHabit(habit.id)}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Habit FAB */}
            {habits.length > 0 && (
                <button
                    className="add-habit-fab"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={24} />
                </button>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateHabitModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchHabits();
                    }}
                />
            )}

            {showVoiceLogger && (
                <HabitVoiceLogger
                    onClose={() => setShowVoiceLogger(false)}
                    onLogged={() => {
                        setShowVoiceLogger(false);
                        fetchHabits();
                    }}
                />
            )}

            <BottomNavigation />

            <style jsx>{`
                .habits-page {
                    min-height: 100vh;
                    background: var(--color-background);
                    padding: 20px 20px 100px;
                }

                .habits-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }

                .habits-header h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin: 0;
                }

                .habits-subtitle {
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                    margin-top: 4px;
                }

                .voice-log-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: var(--gradient-primary);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .voice-log-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                }

                .habits-summary {
                    background: var(--color-surface);
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    border: 1px solid var(--color-border);
                }

                .summary-ring {
                    position: relative;
                    width: 80px;
                    height: 80px;
                }

                .circular-chart {
                    width: 100%;
                    height: 100%;
                }

                .circle-bg {
                    fill: none;
                    stroke: var(--color-surface-2);
                    stroke-width: 3;
                }

                .circle-progress {
                    fill: none;
                    stroke: var(--color-primary);
                    stroke-width: 3;
                    stroke-linecap: round;
                    transform: rotate(-90deg);
                    transform-origin: 50% 50%;
                    transition: stroke-dasharray 0.5s ease;
                }

                .summary-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }

                .summary-number {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--color-text);
                    display: block;
                }

                .summary-label {
                    font-size: 0.7rem;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                }

                .mini-calendar {
                    display: flex;
                    gap: 8px;
                    flex: 1;
                    justify-content: space-around;
                }

                .calendar-day {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }

                .day-name {
                    font-size: 0.7rem;
                    color: var(--color-text-muted);
                    font-weight: 500;
                }

                .day-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--color-surface-2);
                }

                .day-dot.today {
                    background: var(--color-primary);
                    box-shadow: 0 0 8px var(--color-primary);
                }

                .habits-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .loading-state, .empty-state {
                    text-align: center;
                    padding: 48px 24px;
                    color: var(--color-text-muted);
                }

                .empty-state {
                    background: var(--color-surface);
                    border-radius: 20px;
                    border: 1px solid var(--color-border);
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }

                .empty-state h3 {
                    color: var(--color-text);
                    margin-bottom: 8px;
                }

                .habit-card {
                    background: var(--color-surface);
                    border-radius: 16px;
                    border: 1px solid var(--color-border);
                    overflow: hidden;
                    transition: all 0.2s;
                }

                .habit-card.completed {
                    border-color: var(--color-success);
                    background: linear-gradient(135deg, var(--color-surface), rgba(34, 197, 94, 0.05));
                }

                .habit-card.expanded {
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }

                .habit-main {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    gap: 12px;
                }

                .habit-toggle {
                    background: none;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .habit-toggle:hover {
                    transform: scale(1.1);
                }

                .habit-toggle.saving {
                    opacity: 0.5;
                }

                .check-icon {
                    color: var(--color-success);
                }

                .circle-icon {
                    color: var(--color-text-muted);
                }

                .habit-info {
                    flex: 1;
                    cursor: pointer;
                }

                .habit-name-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .habit-icon {
                    font-size: 1.25rem;
                }

                .habit-name {
                    font-weight: 600;
                    color: var(--color-text);
                    font-size: 1rem;
                }

                .habit-streak {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    font-size: 0.8rem;
                    color: var(--color-warning);
                    font-weight: 600;
                }

                .habit-goal {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                    margin-top: 4px;
                }

                .habit-expand {
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    padding: 8px;
                    transition: transform 0.2s;
                }

                .habit-expand .rotated {
                    transform: rotate(90deg);
                }

                .habit-details {
                    padding: 0 16px 16px;
                    border-top: 1px solid var(--color-border);
                    margin-top: -1px;
                    padding-top: 16px;
                    animation: slideDown 0.2s ease;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .note-input-wrapper {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .note-input {
                    flex: 1;
                    padding: 10px 14px;
                    border: 1px solid var(--color-border);
                    border-radius: 10px;
                    background: var(--color-background);
                    color: var(--color-text);
                    font-size: 0.9rem;
                }

                .note-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                }

                .save-note-btn {
                    padding: 10px 16px;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .habit-actions {
                    display: flex;
                    gap: 8px;
                }

                .habit-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: var(--color-surface-2);
                    border: none;
                    border-radius: 8px;
                    color: var(--color-text-muted);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .habit-action-btn:hover {
                    background: var(--color-error);
                    color: white;
                }

                .add-habit-fab {
                    position: fixed;
                    bottom: 90px;
                    right: 20px;
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: var(--gradient-primary);
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                    z-index: 10;
                }

                .add-habit-fab:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 6px 24px rgba(139, 92, 246, 0.5);
                }

                .btn-primary-gradient {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    background: var(--gradient-primary);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 16px;
                }
            `}</style>
        </div>
    );
}
