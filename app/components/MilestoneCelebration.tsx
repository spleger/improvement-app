'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface Milestone {
    id: string;
    type: string;
    title: string;
    description: string | null;
    achievedAt: string;
    celebrated: boolean;
}

export default function MilestoneCelebration() {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchUncelebrated() {
            try {
                const res = await fetch('/api/milestones');
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                if (data.uncelebrated && data.uncelebrated.length > 0) {
                    setMilestones(data.uncelebrated);
                    setCurrentIndex(0);
                    setVisible(true);
                }
            } catch {
                // Silently fail -- celebration is non-critical
            }
        }

        fetchUncelebrated();
        return () => { cancelled = true; };
    }, []);

    // Fire confetti when a milestone becomes visible
    useEffect(() => {
        if (!visible || milestones.length === 0) return;

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 2001,
        });

        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            handleDismiss();
        }, 5000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, currentIndex]);

    const handleDismiss = useCallback(async () => {
        const current = milestones[currentIndex];
        if (!current) return;

        // Mark as celebrated
        try {
            await fetch('/api/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ milestoneId: current.id }),
            });
        } catch {
            // Non-critical
        }

        // Show next uncelebrated or close
        if (currentIndex < milestones.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setVisible(false);
        }
    }, [milestones, currentIndex]);

    if (!visible || milestones.length === 0) return null;

    const current = milestones[currentIndex];
    if (!current) return null;

    // Choose icon based on milestone type
    const getTypeIcon = (type: string): string => {
        if (type.startsWith('streak_')) return '*';
        if (type.startsWith('challenges_')) return '#';
        if (type.startsWith('day_')) return '+';
        return '>';
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.3s ease',
            }}
            onClick={handleDismiss}
        >
            <div
                style={{
                    background: 'var(--color-surface, #1a1a2e)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5)',
                    animation: 'slideUp 0.4s ease',
                    position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Glow accent at top */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #8b5cf6, #a78bfa, #8b5cf6, transparent)',
                    borderRadius: '0 0 4px 4px',
                }} />

                {/* Type indicator */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: 'white',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                }}>
                    {getTypeIcon(current.type)}
                </div>

                {/* Title with gradient text */}
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #a78bfa, #c4b5fd, #e9d5ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                }}>
                    {current.title}
                </h2>

                {/* Description */}
                {current.description && (
                    <p style={{
                        color: 'var(--color-text-secondary, #a0a0b8)',
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                        marginBottom: '1.5rem',
                    }}>
                        {current.description}
                    </p>
                )}

                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    Awesome!
                </button>

                {/* Milestone counter */}
                {milestones.length > 1 && (
                    <div style={{
                        marginTop: '0.75rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted, #6b6b80)',
                    }}>
                        {currentIndex + 1} of {milestones.length}
                    </div>
                )}
            </div>
        </div>
    );
}
