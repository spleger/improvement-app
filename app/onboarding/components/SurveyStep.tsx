'use client';

import { useState } from 'react';

interface SurveyStepProps {
    onComplete: (answers: any) => void;
}

export default function SurveyStep({ onComplete }: SurveyStepProps) {
    const [answers, setAnswers] = useState({
        motivation: '',
        currentSituation: '',
        timeAvailable: '30-60 minutes',
        biggestChallenge: 'Consistency'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (answers.motivation && answers.currentSituation) {
            onComplete(answers);
        }
    };

    const isValid = answers.motivation.trim().length > 0 && answers.currentSituation.trim().length > 0;

    return (
        <div className="survey-step">
            <h2 className="survey-title">Quick Questions</h2>
            <p className="survey-subtitle">Help us understand where you're starting from</p>

            <form onSubmit={handleSubmit} className="survey-form">
                <div className="survey-question">
                    <label>1. What's driving you to make a change?</label>
                    <textarea
                        value={answers.motivation}
                        onChange={(e) => setAnswers({ ...answers, motivation: e.target.value })}
                        placeholder="e.g., I want to feel healthier and have more energy..."
                        rows={3}
                        required
                    />
                </div>

                <div className="survey-question">
                    <label>2. Where are you starting from?</label>
                    <textarea
                        value={answers.currentSituation}
                        onChange={(e) => setAnswers({ ...answers, currentSituation: e.target.value })}
                        placeholder="e.g., Desk job, no exercise routine, struggling with consistency..."
                        rows={3}
                        required
                    />
                </div>

                <div className="survey-question">
                    <label>3. How much time can you commit daily?</label>
                    <select
                        value={answers.timeAvailable}
                        onChange={(e) => setAnswers({ ...answers, timeAvailable: e.target.value })}
                    >
                        <option value="15-30 minutes">15-30 minutes</option>
                        <option value="30-60 minutes">30-60 minutes</option>
                        <option value="1-2 hours">1-2 hours</option>
                        <option value="2+ hours">2+ hours</option>
                    </select>
                </div>

                <div className="survey-question">
                    <label>4. What's your biggest challenge with goals?</label>
                    <select
                        value={answers.biggestChallenge}
                        onChange={(e) => setAnswers({ ...answers, biggestChallenge: e.target.value })}
                    >
                        <option value="Starting">Getting started</option>
                        <option value="Consistency">Staying consistent</option>
                        <option value="Motivation">Staying motivated</option>
                        <option value="Knowing what to do">Knowing what to do</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={!isValid}
                    className="survey-submit-btn"
                >
                    Continue →
                </button>
            </form>

            <style jsx>{`
                .survey-step {
                    width: 100%;
                    animation: fadeIn 0.5s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .survey-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 8px;
                }

                .survey-subtitle {
                    font-size: 1rem;
                    color: var(--color-text-muted);
                    margin-bottom: 32px;
                }

                .survey-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .survey-question {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .survey-question label {
                    font-weight: 600;
                    color: var(--color-text);
                    font-size: 0.95rem;
                }

                .survey-question textarea,
                .survey-question select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid var(--color-border);
                    border-radius: 8px;
                    background: var(--color-surface);
                    color: var(--color-text);
                    font-size: 0.95rem;
                    font-family: inherit;
                    resize: vertical;
                }

                .survey-question textarea:focus,
                .survey-question select:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .survey-submit-btn {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 16px;
                }

                .survey-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                }

                .survey-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
