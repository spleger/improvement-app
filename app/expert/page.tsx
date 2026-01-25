import ExpertChat from './ExpertChat';
import BottomNavigation from '../components/BottomNavigation';

export default function ExpertPage() {
    return (
        <div
            className="expert-page"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                background: 'var(--color-background)',
                overflow: 'hidden'
            }}
        >
            {/* Chat Interface (includes its own coach selector) */}
            <div style={{
                flex: 1,
                minHeight: 0,
                paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
            }}>
                <ExpertChat />
            </div>

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
}
