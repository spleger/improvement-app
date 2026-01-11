import Link from 'next/link';
import ExpertChat from './ExpertChat';

export default function ExpertPage() {
    return (
        <div className="page animate-fade-in" style={{ paddingBottom: '80px' }}>
            {/* Header */}
            <div className="page-header">
                <h1 className="heading-2">💬 AI Expert</h1>
                <p className="text-secondary">
                    Get personalized guidance on your transformation journey
                </p>
            </div>

            {/* Chat Interface (includes its own coach selector) */}
            <ExpertChat />

            {/* Bottom Navigation */}
            <nav className="nav-bottom">
                <div className="nav-bottom-inner">
                    <Link href="/" className="nav-item"><span className="nav-item-icon">🏠</span><span className="nav-item-label">Home</span></Link>
                    <Link href="/progress" className="nav-item"><span className="nav-item-icon">📊</span><span className="nav-item-label">Progress</span></Link>
                    <Link href="/diary" className="nav-item"><span className="nav-item-icon">🎙️</span><span className="nav-item-label">Diary</span></Link>
                    <Link href="/expert" className="nav-item active"><span className="nav-item-icon">💬</span><span className="nav-item-label">Expert</span></Link>
                    <Link href="/profile" className="nav-item"><span className="nav-item-icon">👤</span><span className="nav-item-label">Profile</span></Link>
                </div>
            </nav>
        </div>
    );
}
