import BottomNavigation from '@/app/components/BottomNavigation';
import PageHeader from '@/app/components/PageHeader';

export default function DiaryLoading() {
    return (
        <div className="page" style={{ paddingBottom: '100px' }}>
            <PageHeader
                icon="📝"
                title="Voice Diary"
                subtitle="Capture your daily reflections, wins, and blockers"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                {/* Recorder Section */}
                <div className="md:col-span-2 space-y-lg">
                    {/* Voice Recorder Skeleton */}
                    <div className="card-glass loading-breathe" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                        <div className="skeleton-breathe" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-full)', margin: '0 auto var(--spacing-lg)' }} />
                        <div className="skeleton-breathe" style={{ height: '20px', width: '120px', margin: '0 auto var(--spacing-md)', borderRadius: 'var(--radius-sm)' }} />
                        <div className="skeleton-breathe" style={{ height: '14px', width: '180px', margin: '0 auto', borderRadius: 'var(--radius-sm)' }} />
                    </div>

                    <div className="space-y-md">
                        <div className="skeleton-breathe" style={{ height: '28px', width: '150px', borderRadius: 'var(--radius-sm)' }} />

                        {/* Entry Skeletons */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card-glass loading-breathe boxed-accent-top">
                                {/* Header Skeleton */}
                                <div className="flex justify-between items-center mb-md pb-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <div className="skeleton-breathe" style={{ height: '16px', width: '180px', borderRadius: 'var(--radius-sm)' }} />
                                    <div className="skeleton-breathe" style={{ height: '20px', width: '50px', borderRadius: 'var(--radius-full)' }} />
                                </div>
                                {/* Content Skeleton */}
                                <div className="mb-md">
                                    <div className="skeleton-breathe" style={{ height: '20px', width: '60%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                    <div className="skeleton-breathe" style={{ height: '14px', width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-xs)' }} />
                                    <div className="skeleton-breathe" style={{ height: '14px', width: '90%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-xs)' }} />
                                    <div className="skeleton-breathe" style={{ height: '14px', width: '75%', borderRadius: 'var(--radius-sm)' }} />
                                </div>
                                {/* AI Analysis Skeleton */}
                                <div className="boxed-inset loading-breathe">
                                    <div className="skeleton-breathe" style={{ height: '16px', width: '100px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                    <div className="skeleton-breathe" style={{ height: '14px', width: '80%', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }} />
                                    <div className="flex gap-sm">
                                        <div className="skeleton-breathe" style={{ height: '22px', width: '80px', borderRadius: 'var(--radius-full)' }} />
                                        <div className="skeleton-breathe" style={{ height: '22px', width: '60px', borderRadius: 'var(--radius-full)' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Stats Skeleton */}
                <div className="space-y-md">
                    <div className="card-glass loading-breathe boxed-accent-top">
                        <div className="flex items-center gap-sm mb-md">
                            <div className="skeleton-breathe" style={{ height: '20px', width: '20px', borderRadius: 'var(--radius-sm)' }} />
                            <div className="skeleton-breathe" style={{ height: '20px', width: '80px', borderRadius: 'var(--radius-sm)' }} />
                        </div>
                        <div className="skeleton-breathe mb-lg" style={{ height: '14px', width: '100%', borderRadius: 'var(--radius-sm)' }} />

                        {/* Stats Grid Skeleton */}
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="stat-card loading-breathe" style={{ background: 'var(--color-surface-2)' }}>
                                    <div className="skeleton-breathe" style={{ height: '28px', width: '40px', margin: '0 auto var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }} />
                                    <div className="skeleton-breathe" style={{ height: '10px', width: '50px', margin: '0 auto', borderRadius: 'var(--radius-sm)' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
}
