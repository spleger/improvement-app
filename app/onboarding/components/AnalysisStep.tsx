export default function AnalysisStep() {
    return (
        <div className="analysis-step">
            <div className="analysis-spinner" />
            <h2 className="analysis-title">Analyzing Your Responses...</h2>
            <p className="analysis-subtitle">Generating personalized goals just for you</p>

            <style jsx>{`
                .analysis-step {
                    text-align: center;
                    animation: fadeIn 0.5s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .analysis-spinner {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 24px;
                    border: 4px solid var(--color-surface-2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .analysis-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--color-text);
                    margin-bottom: 8px;
                }

                .analysis-subtitle {
                    font-size: 1rem;
                    color: var(--color-text-muted);
                }
            `}</style>
        </div>
    );
}
