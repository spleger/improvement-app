'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#121212',
            color: '#f0f0f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                Something went wrong
            </h2>
            <p style={{ color: '#a0a0b0', marginBottom: '2rem', maxWidth: '300px' }}>
                An unexpected error occurred. Please try again.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={reset}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '1rem',
                    }}
                >
                    Try Again
                </button>
                <a
                    href="/"
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#f0f0f5',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
