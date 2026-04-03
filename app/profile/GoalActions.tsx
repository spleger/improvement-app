'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Trash2 } from 'lucide-react';

interface GoalActionsProps {
    goalId: string;
    status: string;
}

export default function GoalActions({ goalId, status }: GoalActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState<'delete' | 'complete' | null>(null);

    const handleAction = async (action: 'complete' | 'delete') => {
        setLoading(true);
        setShowConfirm(null);
        try {
            const res = await fetch(`/api/goals/${goalId}/${action}`, { method: 'POST' });
            if (res.ok) {
                router.refresh();
            }
        } catch (err) {
            console.error(`Failed to ${action} goal:`, err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <span className="text-tiny text-muted">...</span>;
    }

    return (
        <>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {status === 'active' && (
                    <button
                        onClick={() => setShowConfirm('complete')}
                        title="Complete goal"
                        style={{
                            background: 'rgba(40, 167, 69, 0.15)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: 'var(--color-success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Check size={16} />
                    </button>
                )}
                <button
                    onClick={() => setShowConfirm('delete')}
                    title="Delete goal"
                    style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        color: 'var(--color-error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {showConfirm && (
                <div
                    onClick={() => setShowConfirm(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 200,
                        padding: '24px',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--color-surface)',
                            borderRadius: '20px',
                            padding: '28px 24px 24px',
                            maxWidth: '340px',
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>
                            {showConfirm === 'delete' ? 'Delete this goal?' : 'Complete this goal?'}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
                            {showConfirm === 'delete'
                                ? 'This will permanently remove the goal and all its challenges.'
                                : 'This will mark the goal as completed. You can always create a new one.'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowConfirm(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: 'var(--color-surface-2)',
                                    color: 'var(--color-text)',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(showConfirm)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: showConfirm === 'delete' ? 'var(--color-error)' : 'var(--color-success)',
                                    color: 'white',
                                }}
                            >
                                {showConfirm === 'delete' ? 'Delete' : 'Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
