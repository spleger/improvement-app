'use client';

import { useTheme } from './ThemeContext';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex bg-surface rounded-full p-1 border border-border inline-flex" style={{ background: 'var(--color-surface)', borderRadius: '999px', padding: '4px', border: '1px solid var(--color-border)' }}>
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-white shadow-sm' : 'text-muted hover:text-primary'}`}
                style={{
                    padding: '8px',
                    borderRadius: '50%',
                    background: theme === 'light' ? 'var(--color-background)' : 'transparent',
                    color: theme === 'light' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none'
                }}
                title="Light Mode"
            >
                ☀️
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-2 rounded-full transition-all ${theme === 'system' ? 'bg-white shadow-sm' : 'text-muted hover:text-primary'}`}
                style={{
                    padding: '8px',
                    borderRadius: '50%',
                    background: theme === 'system' ? 'var(--color-background)' : 'transparent',
                    color: theme === 'system' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none'
                }}
                title="System Default"
            >
                🖥️
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-white shadow-sm' : 'text-muted hover:text-primary'}`}
                style={{
                    padding: '8px',
                    borderRadius: '50%',
                    background: theme === 'dark' ? 'var(--color-background)' : 'transparent',
                    color: theme === 'dark' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none'
                }}
                title="Dark Mode"
            >
                🌙
            </button>
        </div>
    );
}
