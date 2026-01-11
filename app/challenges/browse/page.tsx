import Link from 'next/link';
import * as db from '@/lib/db';
import ChallengeBrowser from './ChallengeBrowser';

async function getDomainsAndTemplates() {
    const rawDomains = await db.getAllGoalDomains();
    const domains = rawDomains.map(d => ({
        ...d,
        icon: d.icon || '🎯',
        color: d.color || '#cccccc',
        description: d.description || ''
    }));
    return { domains };
}

export default async function BrowseChallengesPage() {
    const { domains } = await getDomainsAndTemplates();

    return (
        <div className="page animate-fade-in">
            {/* Header */}
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back
            </Link>

            <div className="page-header">
                <h1 className="heading-2">🎯 Challenge Library</h1>
                <p className="text-secondary">
                    Browse challenges by domain and difficulty
                </p>
            </div>

            <ChallengeBrowser domains={domains} />

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
