'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'notification_banner_dismissed_at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function NotificationPermission() {
    const { isSupported, isSubscribed, permission, loading, subscribe } = usePushNotifications();
    const [dismissed, setDismissed] = useState(true); // default hidden until checked

    useEffect(() => {
        if (loading) return;

        // Don't show if not supported, already subscribed, or permission already granted
        if (!isSupported || isSubscribed || permission === 'granted') {
            setDismissed(true);
            return;
        }

        // Don't show if permission was denied (user must reset in browser settings)
        if (permission === 'denied') {
            setDismissed(true);
            return;
        }

        // Check localStorage for recent dismissal
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            if (elapsed < DISMISS_DURATION_MS) {
                setDismissed(true);
                return;
            }
        }

        setDismissed(false);
    }, [isSupported, isSubscribed, permission, loading]);

    const handleEnable = async () => {
        const success = await subscribe();
        if (success) {
            setDismissed(true);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
        setDismissed(true);
    };

    if (dismissed) return null;

    return (
        <div
            className="card-glass"
            style={{
                margin: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div className="heading-5" style={{ marginBottom: 'var(--spacing-xs)' }}>
                        Stay on track with notifications
                    </div>
                    <p className="text-small text-muted" style={{ margin: 0 }}>
                        Get daily challenge reminders and streak alerts so you never miss a day.
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        fontSize: '1.25rem',
                        padding: '0 0 0 var(--spacing-sm)',
                        lineHeight: 1,
                    }}
                    aria-label="Dismiss notification banner"
                >
                    x
                </button>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                    onClick={handleEnable}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                >
                    Enable Notifications
                </button>
                <button
                    onClick={handleDismiss}
                    className="btn btn-secondary"
                >
                    Not Now
                </button>
            </div>
        </div>
    );
}
