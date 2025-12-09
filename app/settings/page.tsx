import Link from 'next/link';
import SettingsForm from './SettingsForm';
import ThemeToggle from '../ThemeToggle';
import * as db from '@/lib/db';

const DEMO_USER_ID = 'demo-user-001';

async function getUserPreferences() {
    const prefs = await db.getUserPreferences(DEMO_USER_ID);
    return prefs;
}

export default async function SettingsPage() {
    const preferences = await getUserPreferences();

    return (
        <div className="page animate-fade-in">
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back
            </Link>

            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="heading-2">⚙️ Settings</h1>
                    <p className="text-secondary">
                        Customize your transformation experience
                    </p>
                </div>
                <ThemeToggle />
            </div>

            <SettingsForm initialPreferences={preferences} />

            {/* Bottom Navigation */}
            <nav className="nav-bottom">
                <div className="nav-bottom-inner">
                    <Link href="/" className="nav-item"><span className="nav-item-icon">🏠</span><span className="nav-item-label">Home</span></Link>
                    <Link href="/progress" className="nav-item"><span className="nav-item-icon">📊</span><span className="nav-item-label">Progress</span></Link>
                    <Link href="/diary" className="nav-item"><span className="nav-item-icon">🎙️</span><span className="nav-item-label">Diary</span></Link>
                    <Link href="/expert" className="nav-item"><span className="nav-item-icon">💬</span><span className="nav-item-label">Expert</span></Link>
                    <Link href="/profile" className="nav-item"><span className="nav-item-icon">👤</span><span className="nav-item-label">Profile</span></Link>
                </div>
            </nav>
        </div>
    );
}
