'use client';

import { useEffect } from 'react';

export default function ProfileError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Profile page error:', error);
    }, [error]);

    return (
        <div className="page animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '2rem',
        }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                :(
            </div>
            <h2 className="heading-3" style={{ marginBottom: '0.5rem' }}>
                Could not load profile
            </h2>
            <p className="text-secondary" style={{ marginBottom: '2rem', maxWidth: '300px' }}>
                A temporary connection issue occurred. This usually resolves itself quickly.
            </p>
            <button
                onClick={reset}
                className="btn-primary"
                style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                }}
            >
                Retry
            </button>
        </div>
    );
}
