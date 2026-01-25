import ExpertChat from './ExpertChat';
import BottomNavigation from '../components/BottomNavigation';

export default function ExpertPage() {
    return (
        <div className="expert-page" style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
            {/* Chat Interface (includes its own coach selector) */}
            <ExpertChat />

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
}
