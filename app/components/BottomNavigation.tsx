'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function BottomNavigation() {
    const pathname = usePathname();
    const [trackingOpen, setTrackingOpen] = useState(false);
    const trackingRef = useRef<HTMLDivElement>(null);

    // Close submenu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (trackingRef.current && !trackingRef.current.contains(event.target as Node)) {
                setTrackingOpen(false);
            }
        }
        if (trackingOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [trackingOpen]);

    // Close submenu on route change
    useEffect(() => {
        setTrackingOpen(false);
    }, [pathname]);

    // Determine active tab based on pathname
    const isTrackingActive = pathname?.startsWith('/habits')
        || pathname?.startsWith('/diary')
        || pathname?.startsWith('/survey');

    const active = pathname === '/' ? 'home'
        : pathname?.startsWith('/progress') ? 'progress'
            : isTrackingActive ? 'tracking'
                : pathname?.startsWith('/expert') ? 'expert'
                    : pathname?.startsWith('/profile') ? 'profile'
                        : '';

    const trackingItems = [
        { label: 'Daily Habits', href: '/habits' },
        { label: 'Voice Diary', href: '/diary' },
        { label: 'Check-in', href: '/survey' },
    ];

    const navItems = [
        { id: 'home', icon: '\u{1F3E0}', label: 'Home', href: '/' },
        { id: 'tracking', icon: '\u{2705}', label: 'Tracking', href: null },
        { id: 'progress', icon: '\u{1F4CA}', label: 'Progress', href: '/progress' },
        { id: 'expert', icon: '\u{1F4AC}', label: 'Expert', href: '/expert' },
        { id: 'profile', icon: '\u{1F464}', label: 'Profile', href: '/profile' },
    ];

    // Hide bottom nav on auth/onboarding pages and expert chat (has its own input bar)
    const hiddenRoutes = ['/login', '/register', '/onboarding', '/expert'];
    if (hiddenRoutes.some(route => pathname?.startsWith(route))) {
        return null;
    }

    return (
        <nav className="nav-bottom">
            <div className="nav-bottom-inner">
                {navItems.map(item => {
                    if (item.id === 'tracking') {
                        return (
                            <div
                                key={item.id}
                                ref={trackingRef}
                                style={{ position: 'relative' }}
                            >
                                <button
                                    onClick={() => setTrackingOpen(prev => !prev)}
                                    className={`nav-item ${active === 'tracking' ? 'active' : ''}`}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        font: 'inherit',
                                    }}
                                    aria-expanded={trackingOpen}
                                    aria-haspopup="true"
                                >
                                    <span className="nav-item-icon">{item.icon}</span>
                                    <span className="nav-item-label">{item.label}</span>
                                </button>

                                {trackingOpen && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 'calc(100% + 12px)',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            zIndex: 200,
                                            background: 'var(--color-surface, #1e1e2e)',
                                            borderRadius: '16px',
                                            padding: '0.5rem',
                                            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.375rem',
                                            minWidth: '160px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                    >
                                        {trackingItems.map(sub => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                onClick={() => setTrackingOpen(false)}
                                                style={{
                                                    display: 'block',
                                                    padding: '0.625rem 1rem',
                                                    borderRadius: '12px',
                                                    background: pathname?.startsWith(sub.href)
                                                        ? 'rgba(var(--color-highlight-rgb, 99, 102, 241), 0.2)'
                                                        : 'rgba(255, 255, 255, 0.06)',
                                                    color: pathname?.startsWith(sub.href)
                                                        ? 'var(--color-highlight, #6366f1)'
                                                        : 'var(--color-text, #e0e0e0)',
                                                    fontSize: '0.9375rem',
                                                    fontWeight: 500,
                                                    letterSpacing: '0.05em',
                                                    textDecoration: 'none',
                                                    textAlign: 'center',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'background 0.15s ease',
                                                }}
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.id}
                            href={item.href!}
                            className={`nav-item ${active === item.id ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            <span className="nav-item-label">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
