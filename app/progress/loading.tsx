export default function ProgressLoading() {
    return (
        <div className="page animate-fade-in">
            <div className="page-header">
                <div className="skeleton" style={{ height: 28, width: 180, borderRadius: 8 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
                <div className="skeleton" style={{ height: 44, borderRadius: 12 }} />
                <div className="skeleton" style={{ height: 44, borderRadius: 12 }} />
            </div>
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                ))}
            </div>
            <div className="skeleton" style={{ height: 200, borderRadius: 12, marginBottom: '1.5rem' }} />
            <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
        </div>
    );
}
