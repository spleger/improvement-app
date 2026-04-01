'use client';
import { useState } from 'react';

interface Props {
    title: string;
    difficulty: number;
    isRealityShift: boolean;
    description?: string;
    goalId?: string;
    onAccept: () => void;
}

export default function ChallengeProposal({ title, difficulty, isRealityShift, description, goalId, onAccept }: Props) {
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/challenges/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description: description || `Challenge: ${title}`,
                    difficulty,
                    isRealityShift,
                    goalId: goalId || undefined
                })
            });

            const result = await res.json();
            if (!result.success) {
                setError(result.error || 'Failed to accept challenge');
                return;
            }

            setAccepted(true);
            if (onAccept) onAccept();
        } catch (e) {
            console.error(e);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (accepted) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center animate-fade-in">
                <div className="text-green-400 font-bold mb-1">Challenge Accepted!</div>
                <div className="text-sm text-muted">Added to your today's challenges.</div>
            </div>
        );
    }

    return (
        <div className="card p-4 my-2 border border-primary/20 bg-primary/5">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-lg">{title}</h4>
                    {description && (
                        <p className="text-sm text-muted mt-1">{description}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
                            Difficulty {difficulty}/10
                        </span>
                        {isRealityShift && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Reality Shift
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-400 mb-2">{error}</div>
            )}

            <button
                onClick={handleAccept}
                disabled={loading}
                className="btn btn-primary w-full justify-center"
            >
                {loading ? 'Adding...' : 'Accept Challenge'}
            </button>
        </div>
    );
}
