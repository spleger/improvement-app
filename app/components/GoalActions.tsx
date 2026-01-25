'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GoalActions({ goalId, goalTitle }: { goalId: string, goalTitle: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAction = async (action: 'complete' | 'delete') => {
        if (!confirm(`Are you sure you want to ${action} "${goalTitle}"?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/goals/${goalId}/${action}`, {
                method: 'POST'
            });
            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-sm">
            <button
                onClick={() => handleAction('complete')}
                disabled={loading}
                className="btn btn-ghost text-success"
                title="Mark as Complete"
                style={{
                    minHeight: '44px',
                    minWidth: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: '1.25rem',
                    padding: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
            >
                ✅
            </button>
            <button
                onClick={() => handleAction('delete')}
                disabled={loading}
                className="btn btn-ghost text-error"
                title="Delete Goal"
                style={{
                    minHeight: '44px',
                    minWidth: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: '1.25rem',
                    padding: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
            >
                🗑️
            </button>
        </div>
    );
}
