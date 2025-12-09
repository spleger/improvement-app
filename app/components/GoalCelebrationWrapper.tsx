'use client';

import { useState, useEffect } from 'react';
import GoalCompletionModal from './GoalCompletionModal';

interface Goal {
    id: string;
    title: string;
    domain?: { name: string; color: string };
    startedAt: string;
}

export default function GoalCelebrationWrapper({ goals }: { goals: any[] }) {
    const [celebratingGoal, setCelebratingGoal] = useState<Goal | null>(null);

    useEffect(() => {
        // Check for goals that reached 30 days and haven't been acknowledged
        // Ideally we check a "celebrated" flag in DB, but for now we'll use local storage 
        // to avoid annoyance, combined with the date check.

        const checkGoals = () => {
            const completedGoals = goals.filter(goal => {
                const startDate = new Date(goal.startedAt);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Demo logic: If > 30 days (or just for demo purposes, if it's "finished")
                // Let's stick to the 30 day rule.
                // For demo purposes, I'll allow 0 days if user wants to test, but let's stick to 30.
                // To make it testable now, checking if query param ?celebrate=true exists might be good, but we can't easily access searchParams in client component directly without useSearchParams.

                return diffDays >= 30;
            });

            for (const goal of completedGoals) {
                const hasCelebrated = localStorage.getItem(`celebrated_goal_${goal.id}`);
                if (!hasCelebrated) {
                    setCelebratingGoal(goal);
                    break; // One at a time
                }
            }
        };

        checkGoals();
    }, [goals]);

    const handleClose = () => {
        if (celebratingGoal) {
            localStorage.setItem(`celebrated_goal_${celebratingGoal.id}`, 'true');
            setCelebratingGoal(null);
        }
    };

    if (!celebratingGoal) return null;

    return (
        <GoalCompletionModal
            goal={{
                ...celebratingGoal,
                currentDays: 30, // calculated
                totalDays: 30
            }}
            onClose={handleClose}
        />
    );
}
