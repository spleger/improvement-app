export default function SettingsLoading() {
    return (
        <div className="page animate-fade-in">
            <div className="page-header">
                <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 8 }} />
            </div>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: '1rem' }} />
            ))}
        </div>
    );
}
