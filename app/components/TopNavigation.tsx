'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface OngoingChallenge {
    title: string;
    day: number;
    totalDays: number;
}

export default function TopNavigation() {
    const pathname = usePathname();
    const [challenge, setChallenge] = useState<OngoingChallenge | null>(null);
    const [showQuickActions, setShowQuickActions] = useState(false);

    // Fetch ongoing challenge data
    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const response = await fetch('/api/goals');
                if (response.ok) {
                    const goals = await response.json();
                    // Find an active goal (in_progress)
                    const activeGoal = goals.find((goal: { status: string; title: string; currentDay: number; totalDays: number }) => goal.status === 'in_progress');
                    if (activeGoal) {
                        setChallenge({
                            title: activeGoal.title,
                            day: activeGoal.currentDay || 1,
                            totalDays: activeGoal.totalDays || 30
                        });
                    }
                }
            } catch {
                // Silently fail - challenge badge just won't show
            }
        };
        fetchChallenge();
    }, []);

    const quickActions = [
        { id: 'habits', icon: '✅', label: 'Log habits', href: '/habits' },
        { id: 'diary', icon: '🎙️', label: 'Voice diary', href: '/diary' },
        { id: 'checkin', icon: '📊', label: 'Check-in', href: '/progress' },
    ];

    // Close quick actions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.quick-actions-container')) {
                setShowQuickActions(false);
            }
        };

        if (showQuickActions) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showQuickActions]);

    // Close menu on route change
    useEffect(() => {
        setShowQuickActions(false);
    }, [pathname]);

    return (
        <nav className="nav-top">
            <div className="nav-top-inner">
                {/* Profile icon - left */}
                <Link href="/profile" className="nav-top-profile" aria-label="Profile">
                    <span className="nav-top-profile-icon">👤</span>
                </Link>

                {/* App title/home link - center */}
                <Link href="/" className="nav-top-title">
                    <span className="nav-top-logo">🐿️</span>
                    <span className="nav-top-quote">Grow Daily</span>
                </Link>

                {/* Quick actions + Challenge badge - right */}
                <div className="nav-top-right">
                    {/* Quick Actions Menu */}
                    <div className="quick-actions-container">
                        <button
                            className="nav-top-quick-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowQuickActions(!showQuickActions);
                            }}
                            aria-label="Quick actions"
                            aria-expanded={showQuickActions}
                        >
                            <span className="nav-top-quick-icon">⚡</span>
                        </button>

                        {showQuickActions && (
                            <div className="quick-actions-dropdown">
                                {quickActions.map(action => (
                                    <Link
                                        key={action.id}
                                        href={action.href}
                                        className="quick-action-item"
                                    >
                                        <span className="quick-action-icon">{action.icon}</span>
                                        <span className="quick-action-label">{action.label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ongoing challenge badge */}
                    {challenge && (
                        <Link href="/progress" className="nav-top-challenge">
                            <span className="challenge-day">Day {challenge.day}</span>
                            <span className="challenge-progress">/{challenge.totalDays}</span>
                        </Link>
                    )}
                </div>
            </div>

            <style jsx>{`
                .nav-top {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: var(--color-surface-solid);
                    border-bottom: 1px solid var(--color-border);
                    padding: var(--spacing-sm) var(--spacing-md);
                    z-index: 100;
                    /* Safe area for top notch */
                    padding-top: calc(var(--spacing-sm) + env(safe-area-inset-top));
                }

                .nav-top-inner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    max-width: 600px;
                    margin: 0 auto;
                    min-height: 44px;
                }

                .nav-top-profile {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: var(--radius-full);
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    transition: all var(--transition-fast);
                }

                .nav-top-profile:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-accent);
                }

                .nav-top-profile-icon {
                    font-size: 1.25rem;
                }

                .nav-top-title {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    text-decoration: none;
                    transition: opacity var(--transition-fast);
                }

                .nav-top-title:hover {
                    opacity: 0.8;
                }

                .nav-top-logo {
                    font-size: 1.25rem;
                }

                .nav-top-quote {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--color-text-primary);
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 150px;
                }

                .nav-top-right {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }

                .quick-actions-container {
                    position: relative;
                }

                .nav-top-quick-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-full);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .nav-top-quick-btn:hover {
                    background: var(--color-surface-hover);
                }

                .nav-top-quick-icon {
                    font-size: 1.125rem;
                }

                .quick-actions-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: var(--spacing-sm);
                    background: var(--color-surface-solid);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-sm);
                    min-width: 160px;
                    box-shadow: var(--shadow-lg);
                    z-index: 110;
                    animation: slideDown 0.15s ease-out;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .quick-action-item {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-sm) var(--spacing-md);
                    border-radius: var(--radius-md);
                    text-decoration: none;
                    color: var(--color-text-primary);
                    transition: all var(--transition-fast);
                }

                .quick-action-item:hover {
                    background: var(--color-surface-hover);
                }

                .quick-action-icon {
                    font-size: 1rem;
                }

                .quick-action-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .nav-top-challenge {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    padding: var(--spacing-xs) var(--spacing-sm);
                    background: var(--gradient-primary);
                    border-radius: var(--radius-full);
                    text-decoration: none;
                    transition: all var(--transition-fast);
                }

                .nav-top-challenge:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 12px rgba(13, 148, 136, 0.4);
                }

                .challenge-day {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: white;
                }

                .challenge-progress {
                    font-size: 0.625rem;
                    color: rgba(255, 255, 255, 0.8);
                }

                @media (max-width: 640px) {
                    .nav-top {
                        padding: var(--spacing-xs) var(--spacing-sm);
                        padding-top: calc(var(--spacing-xs) + env(safe-area-inset-top));
                    }

                    .nav-top-quote {
                        font-size: 0.9rem;
                        max-width: 120px;
                    }

                    .nav-top-profile {
                        width: 36px;
                        height: 36px;
                    }

                    .nav-top-profile-icon {
                        font-size: 1rem;
                    }

                    .quick-actions-dropdown {
                        right: -8px;
                    }
                }
            `}</style>
        </nav>
    );
}
