'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BottomNavigation() {
    const pathname = usePathname();
    const [showTrackingMenu, setShowTrackingMenu] = useState(false);

    // Determine active tab based on pathname
    // Home, Tracking (covers /habits, /diary), Progress, Expert
    const getActiveTab = () => {
        if (pathname === '/') return 'home';
        if (pathname?.startsWith('/progress')) return 'progress';
        if (pathname?.startsWith('/habits') || pathname?.startsWith('/diary')) return 'tracking';
        if (pathname?.startsWith('/expert')) return 'expert';
        return '';
    };

    const active = getActiveTab();

    // Close tracking menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.tracking-submenu-container')) {
                setShowTrackingMenu(false);
            }
        };

        if (showTrackingMenu) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showTrackingMenu]);

    // Close menu on route change
    useEffect(() => {
        setShowTrackingMenu(false);
    }, [pathname]);

    const trackingSubmenu = [
        { id: 'habits', label: 'Daily Habits', href: '/habits' },
        { id: 'diary', label: 'Voice Diary', href: '/diary' },
        { id: 'checkin', label: 'Check-in', href: '/survey' },
    ];

    return (
        <nav className="nav-bottom">
            <div className="nav-bottom-inner">
                {/* Home */}
                <Link
                    href="/"
                    className={`nav-item ${active === 'home' ? 'active' : ''}`}
                >
                    <span className="nav-item-icon">🏠</span>
                    <span className="nav-item-label">Home</span>
                </Link>

                {/* Tracking with submenu */}
                <div className="tracking-submenu-container">
                    <button
                        className={`nav-item ${active === 'tracking' ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTrackingMenu(!showTrackingMenu);
                        }}
                        aria-label="Tracking"
                        aria-expanded={showTrackingMenu}
                    >
                        <span className="nav-item-icon">📋</span>
                        <span className="nav-item-label">Tracking</span>
                    </button>

                    {showTrackingMenu && (
                        <div className="tracking-submenu-dropdown">
                            {trackingSubmenu.map(item => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="tracking-submenu-item"
                                >
                                    {/* <span className="tracking-submenu-icon">{item.icon}</span> */}
                                    <span className="tracking-submenu-label">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress */}
                <Link
                    href="/progress"
                    className={`nav-item ${active === 'progress' ? 'active' : ''}`}
                >
                    <span className="nav-item-icon">📊</span>
                    <span className="nav-item-label">Progress</span>
                </Link>

                {/* Expert */}
                <Link
                    href="/expert"
                    className={`nav-item ${active === 'expert' ? 'active' : ''}`}
                >
                    <span className="nav-item-icon">💬</span>
                    <span className="nav-item-label">Expert</span>
                </Link>
            </div>

            <style jsx>{`
                .nav-bottom {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--color-surface-solid);
                    border-top: 1px solid var(--color-border);
                    z-index: 100;
                    padding-bottom: env(safe-area-inset-bottom);
                }

                .nav-bottom-inner {
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    height: 60px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    color: var(--color-text-secondary);
                    font-size: 0.75rem;
                    gap: 4px;
                    padding: 4px;
                    border-radius: 8px;
                    transition: all var(--transition-fast);
                    flex: 1;
                    height: 100%;
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                .nav-item.active {
                    color: var(--color-primary);
                }

                .nav-item-icon {
                    font-size: 1.25rem;
                }

                .nav-item-label {
                    font-weight: 500;
                }

                .tracking-submenu-container {
                    position: relative;
                }

                .tracking-submenu-dropdown {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: var(--spacing-md); /* Increased spacing */
                    background: var(--color-surface-solid);
                    border: 1px solid var(--color-border);
                    border-radius: 20px; /* More rounded container */
                    padding: var(--spacing-sm);
                    min-width: 180px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px; /* Gap for pills */
                    box-shadow: var(--shadow-lg);
                    z-index: 110;
                    animation: slideUp 0.15s ease-out;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                .tracking-submenu-item {
                    display: flex;
                    align-items: center;
                    justify-content: center; /* Center text */
                    gap: var(--spacing-sm);
                    padding: 12px 20px; /* Larger hit area */
                    border-radius: 9999px; /* Pill shape */
                    text-decoration: none;
                    color: var(--color-text-primary);
                    background: var(--color-surface-2);
                    border: 1px solid var(--color-border); /* Explicit border */
                    transition: all var(--transition-fast);
                    font-weight: 600; /* Bolder text */
                }

                .tracking-submenu-item:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-primary);
                    transform: translateY(-2px); /* Slight lift */
                    box-shadow: var(--shadow-sm);
                }

                /* Icon removed from DOM, style not needed, but keeping for safety if used elsewhere or future */
                .tracking-submenu-icon {
                    display: none; /* Hide if still present */
                }

                .tracking-submenu-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                /* Override nav-item styles for button */
                .tracking-submenu-container .nav-item {
                    background: none;
                    border: none;
                    cursor: pointer;
                }
            `}</style>
        </nav>
    );
}
