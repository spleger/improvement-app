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
        <div className="flex gap-1 ml-2">
            <button
                onClick={() => handleAction('complete')}
                disabled={loading}
                className="btn btn-ghost p-2 text-success hover:bg-success/10 rounded-full"
                title="Mark as Complete"
            >
                ✅
            </button>
            <button
                onClick={() => handleAction('delete')}
                disabled={loading}
                className="btn btn-ghost p-2 text-error hover:bg-error/10 rounded-full"
                title="Delete Goal"
            >
                🗑️
            </button>
        </div>
    );
}
