'use client';

import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
    isSupported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission | 'default';
    loading: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [state, setState] = useState<PushNotificationState>({
        isSupported: false,
        isSubscribed: false,
        permission: 'default',
        loading: true,
    });

    // Check support and existing subscription on mount
    useEffect(() => {
        async function checkState() {
            const supported =
                typeof window !== 'undefined' &&
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window;

            if (!supported) {
                setState({ isSupported: false, isSubscribed: false, permission: 'default', loading: false });
                return;
            }

            const permission = Notification.permission;
            let subscribed = false;

            try {
                const registration = await navigator.serviceWorker.ready;
                const existing = await registration.pushManager.getSubscription();
                subscribed = existing !== null;
            } catch {
                // SW not ready yet or push manager unavailable
            }

            setState({ isSupported: true, isSubscribed: subscribed, permission, loading: false });
        }

        checkState();
    }, []);

    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (!state.isSupported) return 'denied';
        const result = await Notification.requestPermission();
        setState(prev => ({ ...prev, permission: result }));
        return result;
    }, [state.isSupported]);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!state.isSupported) return false;

        try {
            // Ensure we have permission
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
                setState(prev => ({ ...prev, permission }));
            }
            if (permission !== 'granted') return false;

            // Get VAPID public key
            const vapidResponse = await fetch('/api/push/vapid');
            const { publicKey } = await vapidResponse.json();
            if (!publicKey) {
                console.error('No VAPID public key configured');
                return false;
            }

            // Subscribe via push manager
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
            });

            // Send subscription to server
            const subJson = subscription.toJSON();
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: subJson.endpoint,
                    keys: {
                        p256dh: subJson.keys?.p256dh || '',
                        auth: subJson.keys?.auth || '',
                    },
                }),
            });

            if (response.ok) {
                setState(prev => ({ ...prev, isSubscribed: true }));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return false;
        }
    }, [state.isSupported]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!state.isSupported) return false;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Notify server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });

                // Unsubscribe from browser
                await subscription.unsubscribe();
            }

            setState(prev => ({ ...prev, isSubscribed: false }));
            return true;
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            return false;
        }
    }, [state.isSupported]);

    return {
        isSupported: state.isSupported,
        isSubscribed: state.isSubscribed,
        permission: state.permission,
        loading: state.loading,
        requestPermission,
        subscribe,
        unsubscribe,
    };
}
