export default function SurveyLoading() {
    return (
        <div className="page animate-fade-in">
            <div className="page-header">
                <div className="skeleton" style={{ height: 28, width: 180, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 18, width: 220, borderRadius: 6, marginTop: 8 }} />
            </div>
            <div className="skeleton" style={{ height: 300, borderRadius: 16, marginBottom: '1rem' }} />
            <div className="skeleton" style={{ height: 48, borderRadius: 12 }} />
        </div>
    );
}
