'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Goal {
    id: string;
    title: string;
}

export default function GoalSelector({ goals, selectedGoalId }: { goals: Goal[]; selectedGoalId: string | null }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    if (goals.length <= 1) return null;

    const handleChange = (goalId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (goalId === 'all') {
            params.delete('goalId');
        } else {
            params.set('goalId', goalId);
        }
        router.push(`/progress?${params.toString()}`);
    };

    return (
        <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
        }}>
            <button
                onClick={() => handleChange('all')}
                style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: !selectedGoalId ? 'var(--gradient-primary)' : 'var(--color-surface)',
                    color: !selectedGoalId ? 'white' : 'var(--color-text-muted)',
                    transition: 'all 150ms ease',
                }}
            >
                All Goals
            </button>
            {goals.map(goal => (
                <button
                    key={goal.id}
                    onClick={() => handleChange(goal.id)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        background: selectedGoalId === goal.id ? 'var(--gradient-primary)' : 'var(--color-surface)',
                        color: selectedGoalId === goal.id ? 'white' : 'var(--color-text-muted)',
                        transition: 'all 150ms ease',
                    }}
                >
                    {goal.title}
                </button>
            ))}
        </div>
    );
}
