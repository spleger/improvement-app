'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

interface Goal {
    id: string;
    title: string;
    domain?: { name: string; color: string };
    currentDays: number;
    totalDays: number;
}

interface Props {
    goal: Goal;
    onClose: () => void;
}

export default function GoalCompletionModal({ goal, onClose }: Props) {
    const router = useRouter();
    const [action, setAction] = useState<'none' | 'extend' | 'archive' | 'levelup'>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleAction = async (selectedAction: 'extend' | 'archive' | 'levelup') => {
        setAction(selectedAction);
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/goals/${goal.id}/${selectedAction}`, {
                method: 'POST'
            });

            if (response.ok) {
                router.refresh();
                onClose();
            } else {
                throw new Error('Failed to update goal');
            }
        } catch (error) {
            console.error('Error updating goal:', error);
            setIsSubmitting(false);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal text-center" style={{ maxWidth: '500px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                <h2 className="heading-2 mb-sm">Goal Mastered!</h2>
                <p className="text-body text-secondary mb-lg">
                    Incredible work! You've completed <strong>30 days</strong> of <br />
                    <span style={{
                        color: goal.domain?.color || 'var(--color-primary)',
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                    }}>
                        {goal.title}
                    </span>
                </p>

                <div className="card card-surface mb-xl p-md">
                    <div className="flex justify-between text-small text-muted mb-xs">
                        <span>Consistency</span>
                        <span>Growth</span>
                    </div>
                    <div className="flex justify-between heading-4">
                        <span className="text-success">Legendary</span>
                        <span className="text-primary">Unstoppable</span>
                    </div>
                </div>

                <h3 className="heading-4 mb-md">What's your next move?</h3>

                <div className="flex flex-col gap-md">
                    <button
                        onClick={() => handleAction('levelup')}
                        disabled={isSubmitting}
                        className="btn btn-primary w-full py-md"
                        style={{ background: 'var(--gradient-fire)' }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>🚀</span>
                        <div className="text-left flex-1 ml-md">
                            <div className="font-bold">Level Up</div>
                            <div className="text-tiny opacity-90">Start a harder 30-day challenge</div>
                        </div>
                        <span>→</span>
                    </button>

                    <button
                        onClick={() => handleAction('extend')}
                        disabled={isSubmitting}
                        className="btn btn-secondary w-full py-md"
                    >
                        <span style={{ fontSize: '1.5rem' }}>🔄</span>
                        <div className="text-left flex-1 ml-md">
                            <div className="font-bold">Keep Going</div>
                            <div className="text-tiny text-muted">Extend for another 30 days</div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleAction('archive')}
                        disabled={isSubmitting}
                        className="btn btn-ghost w-full"
                    >
                        Archive & Rest
                    </button>
                </div>
            </div>
        </div>
    );
}
