import BottomNavigation from '../components/BottomNavigation';
import PageHeader from '../components/PageHeader';

export default function HabitsLoading() {
    return (
        <div className="page habits-page" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <PageHeader
                icon="✅"
                title="Habits"
                subtitle="Build consistency, one day at a time"
            />

            {/* Progress Summary Skeleton */}
            <div className="habits-summary loading-breathe" style={{
                background: 'var(--color-surface)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xl)',
                border: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)'
            }}>
                {/* Ring Skeleton */}
                <div className="skeleton-breathe" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-full)',
                    flexShrink: 0
                }} />
                {/* Mini Calendar Skeleton */}
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flex: 1, justifyContent: 'space-around' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <div className="skeleton-breathe" style={{ height: '12px', width: '12px', borderRadius: 'var(--radius-sm)' }} />
                            <div className="skeleton-breathe" style={{ height: '8px', width: '8px', borderRadius: 'var(--radius-full)' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Habits List Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        className="loading-breathe"
                        style={{
                            background: 'var(--color-surface)',
                            backdropFilter: 'var(--glass-blur)',
                            WebkitBackdropFilter: 'var(--glass-blur)',
                            borderRadius: 'var(--radius-lg)',
                            border: 'var(--glass-border)',
                            boxShadow: 'var(--glass-shadow)',
                            padding: 'var(--spacing-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)'
                        }}
                    >
                        {/* Toggle Skeleton */}
                        <div className="skeleton-breathe" style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', flexShrink: 0 }} />
                        {/* Info Skeleton */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <div className="skeleton-breathe" style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
                                <div className="skeleton-breathe" style={{ height: '18px', width: '120px', borderRadius: 'var(--radius-sm)' }} />
                            </div>
                            <div className="skeleton-breathe" style={{ height: '12px', width: '80px', borderRadius: 'var(--radius-sm)', marginTop: 'var(--spacing-xs)' }} />
                        </div>
                        {/* Expand Skeleton */}
                        <div className="skeleton-breathe" style={{ width: '20px', height: '20px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                    </div>
                ))}
            </div>

            <BottomNavigation />
        </div>
    );
}
