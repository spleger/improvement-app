import Link from 'next/link';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function getChallengeHistory() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    const challenges = await db.getChallengesByUserId(user.userId, { limit: 30 });
    return challenges;
}

export default async function ChallengesListPage() {
    const challenges = await getChallengeHistory();

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✅';
            case 'skipped': return '⏭️';
            case 'pending': return '⏳';
            default: return '○';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'var(--color-success)';
            case 'skipped': return 'var(--color-error)';
            default: return 'var(--color-text-muted)';
        }
    };

    return (
        <div className="page animate-fade-in">
            <div className="page-header">
                <h1 className="heading-2">📋 Challenge History</h1>
                <p className="text-secondary">Your past and upcoming challenges</p>
            </div>

            {challenges.length === 0 ? (
                <div className="card text-center">
                    <p className="text-secondary mb-lg">No challenges yet. Create a goal to get started!</p>
                    <Link href="/goals/new" className="btn btn-primary">
                        Create Your First Goal
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-md">
                    {challenges.map(challenge => (
                        <Link
                            key={challenge.id}
                            href={`/challenges/${challenge.id}`}
                            className="card"
                            style={{ textDecoration: 'none' }}
                        >
                            <div className="flex items-center gap-md">
                                <span style={{ fontSize: '1.5rem' }}>
                                    {getStatusIcon(challenge.status)}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div className="heading-4">{challenge.title}</div>
                                    <div className="text-small text-muted flex gap-md">
                                        <span>
                                            {new Date(challenge.scheduledDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        <span>•</span>
                                        <span>Difficulty {challenge.difficulty}/10</span>
                                        {challenge.isRealityShift && (
                                            <>
                                                <span>•</span>
                                                <span style={{ color: '#f12711' }}>⚡ Reality Shift</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className="text-tiny"
                                    style={{
                                        color: getStatusColor(challenge.status),
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {challenge.status}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

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
