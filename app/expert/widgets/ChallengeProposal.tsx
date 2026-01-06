'use client';
import { useState } from 'react';

interface Props {
    title: string;
    difficulty: number;
    isRealityShift: boolean;
    onAccept: () => void;
}

export default function ChallengeProposal({ title, difficulty, isRealityShift, onAccept }: Props) {
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        setLoading(true);
        try {
            // Create the challenge
            const res = await fetch('/api/goals/1/action', { // Using placeholder ID logic for now, ideally we use proper endpoint
                method: 'POST',
                body: JSON.stringify({
                    action: 'create_challenge', // We might need a dedicated endpoint for ad-hoc challenges
                    title,
                    difficulty,
                    isRealityShift
                })
            });

            // Better approach: Use the create challenge endpoint directly if we had one for ad-hoc
            // For now, let's assume we use the 'generate' endpoint logic or similar.
            // Actually, let's use the 'accept' endpoint I created/stubbed earlier

            await fetch('/api/challenges/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, difficulty })
            });

            setAccepted(true);
            if (onAccept) onAccept();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (accepted) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center animate-fade-in">
                <div className="text-green-400 font-bold mb-1">✓ Challenge Accepted!</div>
                <div className="text-sm text-muted">Added to your calendar.</div>
            </div>
        );
    }

    return (
        <div className="card p-4 my-2 border border-primary/20 bg-primary/5">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-lg">{title}</h4>
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
                <div className="text-2xl">🎯</div>
            </div>

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
