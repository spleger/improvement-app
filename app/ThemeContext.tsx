'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import * as db from '@/lib/db';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentTheme: 'light' | 'dark'; // The actual resolved theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    // Initialize theme from local storage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
        setMounted(true);
    }, []);

    // Update effect to handle theme changes and system preference listeners
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

    // Sync with user preferences if logged in (optional enhancement)
    // This could fetch from API and update context, but starting simple



    return (
        <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
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
