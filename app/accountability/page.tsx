'use client';

import { useState, useEffect } from 'react';
import { Users, Copy, Check, Trash2, Flame, Target, TrendingUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Link from 'next/link';

interface PartnerStats {
    streak: number;
    weekChallenges: number;
    activeGoals: string[];
    habitRate: number;
}

interface Partner {
    id: string;
    partnerUserId: string;
    displayName: string;
    acceptedAt: string | null;
    stats: PartnerStats;
}

export default function AccountabilityPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchPartners = async () => {
        try {
            const res = await fetch('/api/accountability');
            const data = await res.json();
            if (data.success) {
                setPartners(data.data.partners);
            } else {
                setError(data.error || 'Failed to load partners');
            }
        } catch (err) {
            console.error('Failed to fetch partners:', err);
            setError('Failed to load partners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const generateInvite = async () => {
        setInviteLoading(true);
        setCopied(false);
        try {
            const res = await fetch('/api/accountability/invite', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setInviteCode(data.data.inviteCode);
            } else {
                setError(data.error || 'Failed to generate invite');
            }
        } catch (err) {
            console.error('Failed to generate invite:', err);
            setError('Failed to generate invite');
        } finally {
            setInviteLoading(false);
        }
    };

    const copyInviteLink = async () => {
        if (!inviteCode) return;
        const url = `${window.location.origin}/accountability/join?code=${inviteCode}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const removePartner = async (partnershipId: string) => {
        if (!confirm('Remove this accountability partner? This cannot be undone.')) return;

        setRemovingId(partnershipId);
        try {
            const res = await fetch('/api/accountability', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnershipId }),
            });
            const data = await res.json();
            if (data.success) {
                setPartners(prev => prev.filter(p => p.id !== partnershipId));
            } else {
                setError(data.error || 'Failed to remove partner');
            }
        } catch (err) {
            console.error('Failed to remove partner:', err);
            setError('Failed to remove partner');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="page animate-fade-in">
            <PageHeader
                icon="[AP]"
                title="Accountability Partners"
                subtitle="Stay on track together"
            />

            {error && (
                <div className="card-glass mb-lg" style={{
                    borderColor: 'var(--color-error)',
                    background: 'rgba(239, 68, 68, 0.1)',
                }}>
                    <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="btn btn-ghost text-small"
                        style={{ marginTop: 'var(--spacing-sm)' }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Invite Section */}
            <section className="mb-lg">
                <div className="card-glass">
                    <div className="flex items-center gap-md mb-md">
                        <Users size={20} style={{ color: 'var(--color-accent)' }} />
                        <span className="heading-5">Invite a Partner</span>
                    </div>

                    {!inviteCode ? (
                        <button
                            onClick={generateInvite}
                            disabled={inviteLoading}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {inviteLoading ? 'Generating...' : 'Generate Invite Link'}
                        </button>
                    ) : (
                        <div>
                            <p className="text-small text-muted mb-sm">
                                Share this link with someone you want as an accountability partner:
                            </p>
                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-sm)',
                                alignItems: 'center',
                                background: 'var(--color-background)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                border: '1px solid var(--color-border)',
                            }}>
                                <code style={{
                                    flex: 1,
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {typeof window !== 'undefined'
                                        ? `${window.location.origin}/accountability/join?code=${inviteCode}`
                                        : `/accountability/join?code=${inviteCode}`
                                    }
                                </code>
                                <button
                                    onClick={copyInviteLink}
                                    className="btn btn-ghost"
                                    style={{
                                        padding: 'var(--spacing-sm)',
                                        flexShrink: 0,
                                        minHeight: '44px',
                                        minWidth: '44px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    title={copied ? 'Copied!' : 'Copy link'}
                                >
                                    {copied ? <Check size={18} style={{ color: 'var(--color-success)' }} /> : <Copy size={18} />}
                                </button>
                            </div>
                            {copied && (
                                <p className="text-small" style={{ color: 'var(--color-success)', marginTop: 'var(--spacing-xs)' }}>
                                    Link copied to clipboard!
                                </p>
                            )}
                            <button
                                onClick={generateInvite}
                                className="btn btn-ghost text-small"
                                style={{ marginTop: 'var(--spacing-sm)' }}
                            >
                                Generate new link
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Partners List */}
            <section className="mb-lg">
                <h2 className="heading-4 mb-md">Your Partners</h2>

                {loading ? (
                    <div className="flex flex-col gap-md">
                        {[1, 2].map(i => (
                            <div key={i} className="card-glass" style={{ minHeight: '120px' }}>
                                <div className="loading-breathe" style={{
                                    height: '20px',
                                    width: '60%',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--color-surface-2)',
                                    marginBottom: 'var(--spacing-md)',
                                }} />
                                <div className="loading-breathe" style={{
                                    height: '16px',
                                    width: '40%',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--color-surface-2)',
                                }} />
                            </div>
                        ))}
                    </div>
                ) : partners.length === 0 ? (
                    <div className="card-glass" style={{ textAlign: 'center', padding: 'var(--spacing-2xl) var(--spacing-xl)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>
                            <Users size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
                        </div>
                        <h3 className="heading-5 mb-sm" style={{ color: 'var(--color-text)' }}>No partners yet</h3>
                        <p className="text-small text-muted">
                            Invite someone to keep each other accountable!
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-md">
                        {partners.map(partner => (
                            <div key={partner.id} className="card-glass">
                                <div className="flex items-center gap-md mb-md" style={{ flexWrap: 'wrap' }}>
                                    {/* Avatar placeholder */}
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--gradient-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '1.1rem',
                                        flexShrink: 0,
                                    }}>
                                        {partner.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="heading-5" style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {partner.displayName}
                                        </div>
                                        {partner.acceptedAt && (
                                            <div className="text-small text-muted">
                                                Partners since {new Date(partner.acceptedAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removePartner(partner.id)}
                                        disabled={removingId === partner.id}
                                        className="btn btn-ghost"
                                        style={{
                                            color: 'var(--color-text-muted)',
                                            padding: 'var(--spacing-sm)',
                                            minHeight: '44px',
                                            minWidth: '44px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                        title="Remove partner"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {/* Stats Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 'var(--spacing-sm)',
                                }}>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            marginBottom: '2px',
                                        }}>
                                            <Flame size={14} style={{ color: '#f59e0b' }} />
                                            <span className="heading-4" style={{ color: '#f59e0b' }}>
                                                {partner.stats.streak}
                                            </span>
                                        </div>
                                        <span className="text-small text-muted">Streak</span>
                                    </div>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            marginBottom: '2px',
                                        }}>
                                            <Target size={14} style={{ color: 'var(--color-accent)' }} />
                                            <span className="heading-4" style={{ color: 'var(--color-accent)' }}>
                                                {partner.stats.weekChallenges}
                                            </span>
                                        </div>
                                        <span className="text-small text-muted">This Week</span>
                                    </div>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            marginBottom: '2px',
                                        }}>
                                            <TrendingUp size={14} style={{ color: '#22c55e' }} />
                                            <span className="heading-4" style={{ color: '#22c55e' }}>
                                                {partner.stats.habitRate}%
                                            </span>
                                        </div>
                                        <span className="text-small text-muted">Habits</span>
                                    </div>
                                </div>

                                {/* Active Goals */}
                                {partner.stats.activeGoals.length > 0 && (
                                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                                        <div className="text-small text-muted" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                            Working on:
                                        </div>
                                        <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                                            {partner.stats.activeGoals.map((goal, i) => (
                                                <span key={i} style={{
                                                    fontSize: '0.75rem',
                                                    padding: '2px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'rgba(139, 92, 246, 0.15)',
                                                    color: 'var(--color-accent)',
                                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                                }}>
                                                    {goal}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style jsx>{`
                .page {
                    padding-bottom: calc(var(--spacing-xl) + 80px + env(safe-area-inset-bottom));
                }
            `}</style>
        </div>
    );
}
