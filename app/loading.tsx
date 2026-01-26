import BottomNavigation from './components/BottomNavigation';

export default function DashboardLoading() {
    return (
        <div className="page animate-fade-in">
            {/* Header Skeleton */}
            <div className="dashboard-header">
                <div className="skeleton-breathe" style={{ height: '36px', width: '200px', borderRadius: 'var(--radius-md)' }} />
            </div>

            {/* Progress Bar Skeleton */}
            <div className="card mb-lg skeleton-breathe" style={{ background: 'var(--color-surface)', padding: 'var(--spacing-xl)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <div className="skeleton-breathe" style={{ height: '20px', width: '120px', borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton-breathe" style={{ height: '24px', width: '50px', borderRadius: 'var(--radius-sm)' }} />
                </div>
                <div className="skeleton-breathe" style={{ height: '8px', width: '100%', borderRadius: 'var(--radius-full)' }} />
                <div className="skeleton-breathe" style={{ height: '16px', width: '150px', borderRadius: 'var(--radius-sm)', marginTop: 'var(--spacing-sm)' }} />
            </div>

            {/* Goals Section Skeleton */}
            <section className="mb-lg">
                <div className="flex justify-between items-center mb-md">
                    <div className="skeleton-breathe" style={{ height: '24px', width: '180px', borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton-breathe" style={{ height: '36px', width: '80px', borderRadius: 'var(--radius-md)' }} />
                </div>
                <div className="flex flex-col gap-md">
                    {[1, 2].map(i => (
                        <div key={i} className="card-glass loading-breathe" style={{ padding: 'var(--spacing-lg)' }}>
                            <div className="flex items-center gap-md">
                                <div className="skeleton-breathe" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton-breathe" style={{ height: '20px', width: '60%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                    <div className="skeleton-breathe" style={{ height: '14px', width: '40%', borderRadius: 'var(--radius-sm)' }} />
                                </div>
                            </div>
                            <div className="skeleton-breathe mt-md" style={{ height: '6px', width: '100%', borderRadius: 'var(--radius-full)' }} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Challenges Section Skeleton */}
            <section className="mb-lg">
                <div className="flex justify-between items-center mb-md">
                    <div className="skeleton-breathe" style={{ height: '24px', width: '180px', borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton-breathe" style={{ height: '36px', width: '80px', borderRadius: 'var(--radius-md)' }} />
                </div>
                <div className="flex flex-col gap-md">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="challenge-card loading-breathe" style={{ padding: 'var(--spacing-xl)' }}>
                            <div className="flex items-start gap-md">
                                <div className="skeleton-breathe" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton-breathe" style={{ height: '20px', width: '70%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                    <div className="skeleton-breathe" style={{ height: '14px', width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-xs)' }} />
                                    <div className="skeleton-breathe" style={{ height: '14px', width: '80%', borderRadius: 'var(--radius-sm)' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats Section Skeleton */}
            <section className="mb-lg">
                <div className="skeleton-breathe mb-md" style={{ height: '24px', width: '100px', borderRadius: 'var(--radius-sm)' }} />
                <div className="stats-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card loading-breathe" style={{ padding: 'var(--spacing-lg)' }}>
                            <div className="skeleton-breathe" style={{ height: '40px', width: '50px', margin: '0 auto var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }} />
                            <div className="skeleton-breathe" style={{ height: '12px', width: '60px', margin: '0 auto', borderRadius: 'var(--radius-sm)' }} />
                        </div>
                    ))}
                </div>
            </section>

            <BottomNavigation />
        </div>
    );
}
