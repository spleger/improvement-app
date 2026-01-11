'use client';

import { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';

interface Goal {
    id: string;
    title: string;
    domain?: { icon?: string };
}

interface CreateHabitModalProps {
    onClose: () => void;
    onCreated: () => void;
}

const EMOJI_OPTIONS = ['✅', '🏃', '📚', '🧘', '💪', '🎯', '💧', '🌅', '💊', '🥗', '🚭', '📵', '✍️', '🎹', '🌿', '😴'];

export default function CreateHabitModal({ onClose, onCreated }: CreateHabitModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('✅');
    const [frequency, setFrequency] = useState('daily');
    const [goalId, setGoalId] = useState<string | null>(null);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch goals for linking
        fetch('/api/goals')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.goals) {
                    setGoals(data.data.goals);
                }
            })
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    icon,
                    frequency,
                    goalId: goalId || null
                })
            });

            const data = await res.json();
            if (data.success) {
                onCreated();
            } else {
                setError(data.error || 'Failed to create habit');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Habit</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Icon Selector */}
                    <div className="form-group">
                        <label>Icon</label>
                        <div className="emoji-grid">
                            {EMOJI_OPTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className={`emoji-btn ${icon === emoji ? 'selected' : ''}`}
                                    onClick={() => setIcon(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="form-group">
                        <label htmlFor="habit-name">Name *</label>
                        <input
                            id="habit-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Meditation"
                            className="form-input"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="habit-desc">Description (optional)</label>
                        <input
                            id="habit-desc"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., 10 minutes of mindfulness"
                            className="form-input"
                        />
                    </div>

                    {/* Frequency */}
                    <div className="form-group">
                        <label>Frequency</label>
                        <div className="frequency-options">
                            {['daily', 'weekly'].map(freq => (
                                <button
                                    key={freq}
                                    type="button"
                                    className={`frequency-btn ${frequency === freq ? 'selected' : ''}`}
                                    onClick={() => setFrequency(freq)}
                                >
                                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Link to Goal */}
                    {goals.length > 0 && (
                        <div className="form-group">
                            <label>Link to Goal (optional)</label>
                            <select
                                className="form-select"
                                value={goalId || ''}
                                onChange={(e) => setGoalId(e.target.value || null)}
                            >
                                <option value="">No linked goal</option>
                                {goals.map(goal => (
                                    <option key={goal.id} value={goal.id}>
                                        {goal.domain?.icon || '🎯'} {goal.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Creating...' : 'Create Habit'}
                        </button>
                    </div>
                </form>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                        backdrop-filter: blur(4px);
                    }

                    .modal-content {
                        background: var(--color-surface);
                        border-radius: 24px;
                        width: 100%;
                        max-width: 440px;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        animation: modalIn 0.25s ease-out;
                    }

                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(0.95) translateY(20px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid var(--color-border);
                    }

                    .modal-header h2 {
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: var(--color-text);
                        margin: 0;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        color: var(--color-text-muted);
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 8px;
                        transition: all 0.2s;
                    }

                    .close-btn:hover {
                        background: var(--color-surface-2);
                        color: var(--color-text);
                    }

                    form {
                        padding: 24px;
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }

                    .form-group label {
                        display: block;
                        font-size: 0.85rem;
                        font-weight: 600;
                        color: var(--color-text);
                        margin-bottom: 8px;
                    }

                    .form-input, .form-select {
                        width: 100%;
                        padding: 12px 16px;
                        border: 2px solid var(--color-border);
                        border-radius: 12px;
                        background: var(--color-background);
                        color: var(--color-text);
                        font-size: 1rem;
                        transition: border-color 0.2s;
                    }

                    .form-input:focus, .form-select:focus {
                        outline: none;
                        border-color: var(--color-primary);
                    }

                    .emoji-grid {
                        display: grid;
                        grid-template-columns: repeat(8, 1fr);
                        gap: 8px;
                    }

                    .emoji-btn {
                        aspect-ratio: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: var(--color-background);
                        border: 2px solid var(--color-border);
                        border-radius: 10px;
                        font-size: 1.25rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .emoji-btn:hover {
                        border-color: var(--color-primary);
                        transform: scale(1.1);
                    }

                    .emoji-btn.selected {
                        border-color: var(--color-primary);
                        background: var(--color-primary-light);
                    }

                    .frequency-options {
                        display: flex;
                        gap: 12px;
                    }

                    .frequency-btn {
                        flex: 1;
                        padding: 12px;
                        border: 2px solid var(--color-border);
                        border-radius: 12px;
                        background: var(--color-background);
                        color: var(--color-text);
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .frequency-btn:hover {
                        border-color: var(--color-primary);
                    }

                    .frequency-btn.selected {
                        border-color: var(--color-primary);
                        background: var(--color-primary);
                        color: white;
                    }

                    .error-message {
                        padding: 12px;
                        background: rgba(239, 68, 68, 0.1);
                        border: 1px solid var(--color-error);
                        border-radius: 10px;
                        color: var(--color-error);
                        font-size: 0.9rem;
                        margin-bottom: 16px;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 24px;
                    }

                    .btn-secondary, .btn-primary {
                        flex: 1;
                        padding: 14px;
                        border-radius: 12px;
                        font-weight: 600;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .btn-secondary {
                        background: var(--color-surface-2);
                        border: 1px solid var(--color-border);
                        color: var(--color-text);
                    }

                    .btn-secondary:hover {
                        background: var(--color-border);
                    }

                    .btn-primary {
                        background: var(--gradient-primary);
                        border: none;
                        color: white;
                    }

                    .btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                    }

                    .btn-primary:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </div>
    );
}
