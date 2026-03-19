'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const code = searchParams.get('code');

    const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [inviterName, setInviterName] = useState('');

    useEffect(() => {
        if (!code) {
            setStatus('error');
            setMessage('No invite code provided.');
            return;
        }
        // Just mark as ready -- the user will click Accept
        setStatus('ready');
    }, [code]);

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                router.push('/accountability');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, router]);

    const handleAccept = async () => {
        if (!code) return;

        setStatus('accepting');
        try {
            const res = await fetch('/api/accountability/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: code }),
            });

            const data = await res.json();

            if (data.success) {
                setInviterName(data.data.partnership.inviterName || '');
                setStatus('success');
                setMessage('Partnership established!');
            } else if (res.status === 401) {
                // Not logged in -- redirect to login with return URL
                const returnUrl = encodeURIComponent(`/accountability/join?code=${code}`);
                router.push(`/login?returnUrl=${returnUrl}`);
                return;
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to accept invitation.');
            }
        } catch (err) {
            console.error('Error accepting invite:', err);
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        }
    };

    const handleDecline = () => {
        router.push('/');
    };

    return (
        <div className="page animate-fade-in" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
        }}>
            <div className="card-glass" style={{
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                padding: 'var(--spacing-2xl)',
            }}>
                {status === 'loading' && (
                    <>
                        <Loader2 size={48} style={{
                            color: 'var(--color-accent)',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto var(--spacing-lg)',
                        }} />
                        <p className="text-muted">Loading invitation...</p>
                    </>
                )}

                {status === 'ready' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-lg)',
                        }}>
                            <span style={{ fontSize: '1.5rem', color: 'white' }}>AP</span>
                        </div>
                        <h2 className="heading-3 mb-md">Accountability Partner Invite</h2>
                        <p className="text-muted mb-lg">
                            Someone has invited you to be their accountability partner.
                            Accept to share progress and keep each other motivated!
                        </p>
                        <div className="flex gap-md" style={{ justifyContent: 'center' }}>
                            <button
                                onClick={handleAccept}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    minHeight: '44px',
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                }}
                            >
                                <Check size={18} />
                                Accept
                            </button>
                            <button
                                onClick={handleDecline}
                                className="btn btn-ghost"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    minHeight: '44px',
                                    padding: 'var(--spacing-md) var(--spacing-xl)',
                                }}
                            >
                                <X size={18} />
                                Decline
                            </button>
                        </div>
                    </>
                )}

                {status === 'accepting' && (
                    <>
                        <Loader2 size={48} style={{
                            color: 'var(--color-accent)',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto var(--spacing-lg)',
                        }} />
                        <p className="text-muted">Connecting you with your partner...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-lg)',
                        }}>
                            <Check size={32} style={{ color: 'white' }} />
                        </div>
                        <h2 className="heading-3 mb-sm" style={{ color: 'var(--color-success)' }}>
                            {message}
                        </h2>
                        {inviterName && (
                            <p className="text-muted mb-md">
                                You and {inviterName} are now accountability partners.
                            </p>
                        )}
                        <p className="text-small text-muted">
                            Redirecting to your partners page...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-lg)',
                        }}>
                            <X size={32} style={{ color: 'white' }} />
                        </div>
                        <h2 className="heading-3 mb-sm" style={{ color: 'var(--color-error)' }}>
                            Could not accept invite
                        </h2>
                        <p className="text-muted mb-lg">{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="btn btn-primary"
                        >
                            Go to Dashboard
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={
            <div className="page" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
            }}>
                <p className="text-muted">Loading...</p>
            </div>
        }>
            <JoinContent />
        </Suspense>
    );
}
