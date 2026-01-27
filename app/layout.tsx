import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });


export const metadata: Metadata = {
    title: 'Transform - 30-Day Goal Transformation',
    description: 'Turn your aspirations into reality with daily challenges, voice journaling, and AI-powered guidance.',
    keywords: ['goals', 'transformation', 'habits', 'challenges', 'personal development'],
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#000000',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

import { ThemeProvider } from './ThemeContext';
import TopNavigation from './components/TopNavigation';
import BottomNavigation from './components/BottomNavigation';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider>
                    <TopNavigation />
                    <div className="app-container">
                        {children}
                    </div>
                    <BottomNavigation />
                </ThemeProvider>
            </body>
        </html>
    );
}
