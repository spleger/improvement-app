'use client';

interface FirstChallengeStepProps {
    challenge: any;
    onComplete: () => void;
}

export default function FirstChallengeStep({ challenge, onComplete }: FirstChallengeStepProps) {
    if (!challenge) {
        return (
            <div className="first-challenge-step">
                <h2>Goal Created!</h2>
                <p>Your first challenge will be ready on your dashboard.</p>
                <button onClick={onComplete} className="complete-btn">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="first-challenge-step">
            <div className="congrats-icon">🎉</div>
            <h2 className="first-challenge-title">You're All Set!</h2>
            <p className="first-challenge-subtitle">Here's your first challenge</p>

            <div className="challenge-preview">
                <div className="challenge-difficulty">
                    Difficulty: {challenge.difficulty}/10
                </div>
                <h3 className="challenge-title">{challenge.title}</h3>
                <p className="challenge-description">{challenge.description}</p>

                {challenge.personalizationNotes && (
                    <div className="challenge-notes">
                        <strong>How to complete:</strong>
                        <p>{challenge.personalizationNotes}</p>
                    </div>
                )}
            </div>

            <button onClick={onComplete} className="complete-btn">
                Accept Challenge & Go to Dashboard
            </button>

            <style jsx>{`
                .first-challenge-step {
                    width: 100%;
                    text-align: center;
                    animation: fadeIn 0.5s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .congrats-icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }

                .first-challenge-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 8px;
                }

                .first-challenge-subtitle {
                    font-size: 1rem;
                    color: var(--color-text-muted);
                    margin-bottom: 32px;
                }

                .challenge-preview {
                    background: var(--color-surface);
                    border: 2px solid var(--color-border);
                    border-radius: 12px;
                    padding: 24px;
                    text-align: left;
                    margin-bottom: 24px;
                }

                .challenge-difficulty {
                    display: inline-block;
                    background: #3b82f6;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                }

                .challenge-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 12px;
                }

                .challenge-description {
                    color: var(--color-text);
                    line-height: 1.6;
                    margin-bottom: 16px;
                }

                .challenge-notes {
                    background: var(--color-surface-2);
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }

                .challenge-notes strong {
                    display: block;
                    margin-bottom: 6px;
                    color: var(--color-text);
                }

                .challenge-notes p {
                    color: var(--color-text);
                    margin: 0;
                    line-height: 1.5;
                    white-space: pre-line;
                }

                .complete-btn {
                    background: linear-gradient(135deg, #22c55e, #10b981);
                    color: white;
                    border: none;
                    padding: 14px 32px;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .complete-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
                }
            `}</style>
        </div>
    );
}
