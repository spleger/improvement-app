'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ACCENT_COLORS = [
    { id: 'teal', name: 'Teal', primary: '#0d9488', secondary: '#06b6d4' },
    { id: 'gold', name: 'Gold', primary: '#d97706', secondary: '#f59e0b' },
    { id: 'blue', name: 'Blue', primary: '#3b82f6', secondary: '#60a5fa' },
    { id: 'purple', name: 'Purple', primary: '#8b5cf6', secondary: '#a78bfa' },
    { id: 'rose', name: 'Rose', primary: '#e11d48', secondary: '#f43f5e' },
];

type Theme = 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentTheme: 'dark';
    accentColor: string;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [accentColor, setAccentColor] = useState('teal');
    const [mounted, setMounted] = useState(false);

    // Always apply dark mode on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        const savedAccent = localStorage.getItem('accentColor');
        if (savedAccent) {
            setAccentColor(savedAccent);
        }
        setMounted(true);
    }, []);

    // Apply accent color
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const colors = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0];

        root.style.setProperty('--color-accent', colors.primary);
        root.style.setProperty('--color-highlight', colors.primary);
        root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`);
        root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`);

        localStorage.setItem('accentColor', accentColor);
    }, [accentColor, mounted]);

    return (
        <ThemeContext.Provider value={{
            theme: 'dark',
            setTheme: () => {},
            currentTheme: 'dark',
            accentColor,
            setAccentColor,
        }}>
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
