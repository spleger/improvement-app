'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import * as db from '@/lib/db';

const ACCENT_COLORS = [
    { id: 'teal', name: 'Teal', primary: '#0d9488', secondary: '#06b6d4' },
    { id: 'gold', name: 'Gold', primary: '#d97706', secondary: '#f59e0b' },
    { id: 'blue', name: 'Blue', primary: '#3b82f6', secondary: '#60a5fa' },
    { id: 'purple', name: 'Purple', primary: '#8b5cf6', secondary: '#a78bfa' },
    { id: 'rose', name: 'Rose', primary: '#e11d48', secondary: '#f43f5e' },
];

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentTheme: 'light' | 'dark';
    accentColor: string;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [accentColor, setAccentColor] = useState('teal');
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    // Initialize theme and accent from local storage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
        const savedAccent = localStorage.getItem('accentColor');
        if (savedAccent) {
            setAccentColor(savedAccent);
        }
        setMounted(true);
    }, []);

    // Update effect to handle theme changes
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            let resolvedTheme: 'light' | 'dark' = 'light';

            if (theme === 'system') {
                resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
            } else {
                resolvedTheme = theme;
            }

            setCurrentTheme(resolvedTheme);

            if (resolvedTheme === 'dark') {
                root.setAttribute('data-theme', 'dark');
            } else {
                root.removeAttribute('data-theme');
            }

            localStorage.setItem('theme', theme);
        };

        applyTheme();

        const handleChange = () => applyTheme();
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, mounted]);

    // Apply accent color
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const colors = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0]; // Default to Teal

        // Set CSS Variables
        root.style.setProperty('--color-accent', colors.primary);
        root.style.setProperty('--color-highlight', colors.primary);
        root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`);
        root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`);

        localStorage.setItem('accentColor', accentColor);
    }, [accentColor, mounted]);

    // Sync with user preferences if logged in (optional enhancement)
    // This could fetch from API and update context, but starting simple



    return (
        <ThemeContext.Provider value={{ theme, setTheme, currentTheme, accentColor, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
