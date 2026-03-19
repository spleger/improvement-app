'use client';

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { processQueue, getQueueSize } from '@/lib/offlineQueue';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [queueCount, setQueueCount] = useState(0);

    const checkQueue = useCallback(async () => {
        try {
            const count = await getQueueSize();
            setQueueCount(count);
        } catch { /* IndexedDB not available */ }
    }, []);

    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOffline = () => {
            setIsOffline(true);
            setSyncMessage(null);
        };

        const handleOnline = async () => {
            setIsOffline(false);
            try {
                const processed = await processQueue();
                if (processed > 0) {
                    setSyncMessage(`Synced ${processed} pending ${processed === 1 ? 'change' : 'changes'}`);
                    setTimeout(() => setSyncMessage(null), 4000);
                }
            } catch { /* queue processing failed */ }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        // Check queue on mount
        checkQueue();

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [checkQueue]);

    if (!isOffline && !syncMessage) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 0px)',
            left: 0,
            right: 0,
            zIndex: 200,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
            background: isOffline ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            animation: 'slideDown 0.2s ease-out',
        }}>
            {isOffline ? (
                <>
                    <WifiOff size={16} />
                    <span>You are offline{queueCount > 0 ? ` (${queueCount} pending)` : ''}</span>
                </>
            ) : (
                <>
                    <Wifi size={16} />
                    <span>{syncMessage}</span>
                </>
            )}
        </div>
    );
}
