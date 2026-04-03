'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// Short, punchy daily quotes -- one per day, cycles through
const DAILY_QUOTES = [
    'Small steps, big shifts.',
    'You showed up. That counts.',
    'Progress over perfection.',
    'One rep closer.',
    'Today is your edge.',
    'Momentum is built, not found.',
    'Discipline is freedom.',
    'The streak starts now.',
    'Do the hard thing first.',
    'Yesterday you said tomorrow.',
    'Less planning, more doing.',
    'Stack wins, not worries.',
    'Comfort zone? Not today.',
    'Show up before you feel ready.',
    'Tiny gains compound fast.',
    'Your future self is watching.',
    'Effort is never wasted.',
    'Just begin. Then continue.',
    'Consistency beats intensity.',
    'Be the proof it works.',
    'Trust the process.',
    'Grind now, shine later.',
    'You vs. yesterday.',
    'No zero days.',
    'Make it non-negotiable.',
    'Earned, not given.',
    'The work is the shortcut.',
    'Action cures doubt.',
    'Stay hungry, stay humble.',
    'Level up or repeat.',
    'Ship it, then improve.',
];

const HIDDEN_ROUTES = ['/login', '/register', '/onboarding', '/expert'];

export default function TopNavigation() {
    const pathname = usePathname();

    // Deterministic daily quote based on date
    const dailyQuote = useMemo(() => {
        const now = new Date();
        const dayOfYear = Math.floor(
            (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
        );
        return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
    }, []);

    if (HIDDEN_ROUTES.some(route => pathname?.startsWith(route))) {
        return null;
    }

    return (
        <nav className="nav-top">
            <div className="nav-top-inner">
                <Link href="/" className="nav-top-title">
                    <span className="nav-top-logo">🐿️</span>
                    <span className="nav-top-brand">Grow Daily</span>
                </Link>

                <span className="nav-top-divider">|</span>

                <span className="nav-top-quote">{dailyQuote}</span>
            </div>

            <style jsx>{`
                .nav-top {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: rgba(12, 12, 20, 0.95);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    padding: var(--spacing-sm) var(--spacing-md);
                    z-index: 100;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    padding-top: calc(var(--spacing-sm) + env(safe-area-inset-top));
                }

                .nav-top-inner {
                    display: flex;
                    align-items: center;
                    max-width: 600px;
                    margin: 0 auto;
                    min-height: 44px;
                    gap: 10px;
                }

                .nav-top-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    text-decoration: none;
                    flex-shrink: 0;
                    transition: opacity var(--transition-fast);
                }

                .nav-top-title:hover {
                    opacity: 0.8;
                }

                .nav-top-logo {
                    font-size: 1.25rem;
                }

                .nav-top-brand {
                    font-size: 1rem;
                    font-weight: 700;
                    background: var(--gradient-primary);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    white-space: nowrap;
                }

                .nav-top-divider {
                    color: rgba(255, 255, 255, 0.15);
                    font-weight: 300;
                    flex-shrink: 0;
                }

                .nav-top-quote {
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-style: italic;
                    letter-spacing: 0.01em;
                }

                @media (max-width: 640px) {
                    .nav-top {
                        padding: var(--spacing-xs) var(--spacing-sm);
                        padding-top: calc(var(--spacing-xs) + env(safe-area-inset-top));
                    }

                    .nav-top-brand {
                        font-size: 0.9rem;
                    }

                    .nav-top-quote {
                        font-size: 0.75rem;
                    }
                }
            `}</style>
        </nav>
    );
}
