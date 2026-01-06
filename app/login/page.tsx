'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/');
                router.refresh(); // Refresh to update server components with new session
            } else {
                setError(data.error || 'Login failed');
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
                    <h1 className="heading-2 mb-xs">Welcome Back</h1>
                    <p className="text-secondary">Sign in to continue your journey</p>
                </div>

                {error && (
                    <div className="p-sm mb-md rounded bg-red-100 text-red-700 text-sm border border-red-200" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
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
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mb-md"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const res = await fetch('/api/auth/demo', { method: 'POST' });
                                if (res.ok) {
                                    router.push('/');
                                    router.refresh();
                                } else {
                                    setError('Demo login failed. Please try again.');
                                    setLoading(false);
                                }
                            } catch (e) {
                                setError('Demo login failed');
                                setLoading(false);
                            }
                        }}
                        className="btn btn-secondary w-full mb-lg"
                        disabled={loading}
                        style={{ border: '1px dashed var(--color-primary)', background: 'transparent', color: 'var(--color-primary)' }}
                    >
                        🧪 Try Demo Mode
                    </button>

                    <div className="text-center text-small">
                        <span className="text-secondary">Don't have an account? </span>
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Create one
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
