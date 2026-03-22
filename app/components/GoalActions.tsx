'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from './ConfirmModal';

export default function GoalActions({ goalId, goalTitle }: { goalId: string, goalTitle: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'complete' | 'delete' | null>(null);

    const executeAction = async (action: 'complete' | 'delete') => {
        setConfirmAction(null);
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

    const confirmMessages: Record<'complete' | 'delete', { title: string; message: string; confirmLabel: string; variant: 'primary' | 'danger' }> = {
        complete: {
            title: 'Complete goal?',
            message: `Mark "${goalTitle}" as complete? This will archive the goal and celebrate your achievement.`,
            confirmLabel: 'Complete',
            variant: 'primary'
        },
        delete: {
            title: 'Delete goal?',
            message: `Permanently delete "${goalTitle}"? This action cannot be undone, and all associated challenges will be removed.`,
            confirmLabel: 'Delete',
            variant: 'danger'
        }
    };

    return (
        <>
            <div className="flex gap-1 ml-2">
                <button
                    onClick={() => setConfirmAction('complete')}
                    disabled={loading}
                    className="btn btn-ghost p-2 text-success hover:bg-success/10 rounded-full"
                    title="Mark as Complete"
                >
                    ✅
                </button>
                <button
                    onClick={() => setConfirmAction('delete')}
                    disabled={loading}
                    className="btn btn-ghost p-2 text-error hover:bg-error/10 rounded-full"
                    title="Delete Goal"
                >
                    🗑️
                </button>
            </div>

            {confirmAction && (
                <ConfirmModal
                    title={confirmMessages[confirmAction].title}
                    message={confirmMessages[confirmAction].message}
                    confirmLabel={confirmMessages[confirmAction].confirmLabel}
                    variant={confirmMessages[confirmAction].variant}
                    onConfirm={() => executeAction(confirmAction)}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </>
    );
}
