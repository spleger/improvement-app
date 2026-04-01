'use client';
import { useState } from 'react';

interface Props {
    name: string;
    frequency?: 'daily' | 'weekly' | 'custom';
    goalId?: string;
    description?: string;
}

export default function CreateHabitWidget({ name, frequency = 'daily', goalId, description }: Props) {
    const [created, setCreated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description: description || undefined,
                    frequency,
                    goalId: goalId || null,
                })
            });
            const data = await res.json();
            if (res.ok) {
                setCreated(true);
            } else {
                setError(data.error || 'Failed to create habit');
            }
        } catch (e) {
            console.error(e);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (created) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center animate-fade-in">
                <div className="text-green-400 font-bold mb-1">Habit Created!</div>
                <div className="text-sm text-muted">{name} ({frequency})</div>
            </div>
        );
    }

    return (
        <div className="card p-4 my-2 border-l-4 border-l-accent">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="text-xs text-accent font-bold uppercase tracking-wider mb-1">New Habit</div>
                    <h4 className="font-bold">{name}</h4>
                    {description && (
                        <p className="text-sm text-muted mt-1">{description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                            {frequency}
                        </span>
                        {goalId && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                Linked to goal
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {error && <div className="text-sm text-red-400 mb-2">{error}</div>}

            <button
                onClick={handleCreate}
                disabled={loading}
                className="btn btn-primary w-full justify-center"
            >
                {loading ? 'Creating...' : 'Create Habit'}
            </button>
        </div>
    );
}
