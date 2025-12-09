'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavigation() {
    const pathname = usePathname();

    // Determine active tab based on pathname
    const active = pathname === '/' ? 'home'
        : pathname?.startsWith('/progress') ? 'progress'
            : pathname?.startsWith('/diary') ? 'diary'
                : pathname?.startsWith('/expert') ? 'expert'
                    : pathname?.startsWith('/profile') ? 'profile'
                        : '';

    const items = [
        { id: 'home', icon: '🏠', label: 'Home', href: '/' },
        { id: 'progress', icon: '📊', label: 'Progress', href: '/progress' },
        { id: 'diary', icon: '🎙️', label: 'Diary', href: '/diary' },
        { id: 'expert', icon: '💬', label: 'Expert', href: '/expert' },
        { id: 'profile', icon: '👤', label: 'Profile', href: '/profile' },
    ];

    return (
        <nav className="nav-bottom">
            <div className="nav-bottom-inner">
                {items.map(item => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={`nav-item ${active === item.id ? 'active' : ''}`}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        <span className="nav-item-label">{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
