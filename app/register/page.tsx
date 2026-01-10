'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, displayName }),
            });

            const data = await res.json();

            if (res.ok) {
                // New users go straight to onboarding
                router.push('/onboarding');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page flex-center" style={{ minHeight: '80vh', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <div className="text-center mb-lg">
                    <h1 className="heading-2 mb-xs">Create Account</h1>
                    <p className="text-secondary">Start your transformation today</p>
                </div>

                {error && (
                    <div className="p-sm mb-md rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="form-group mb-md">
                        <label className="form-label" htmlFor="name">Display Name</label>
                        <input
                            id="name"
                            type="text"
                            className="form-input w-full"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your Name"
                        />
                    </div>

                    <div className="form-group mb-md">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group mb-lg">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input w-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                        />
                        <p className="text-tiny text-secondary mt-xs">Must be at least 6 characters</p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mb-md"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div className="text-center text-small">
                        <span className="text-secondary">Already have an account? </span>
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
