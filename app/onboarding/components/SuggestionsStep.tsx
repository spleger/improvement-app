'use client';

import { useState } from 'react';

interface SuggestionsStepProps {
    suggestions: any[];
    onSelect: (goal: any) => void;
}

export default function SuggestionsStep({ suggestions, onSelect }: SuggestionsStepProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleSelect = (goal: any, index: number) => {
        setSelectedIndex(index);
        onSelect(goal);
    };

    if (!suggestions || suggestions.length === 0) {
        return (
            <div className="suggestions-step">
                <h2>No suggestions available</h2>
                <p>Let's create a goal manually instead.</p>
                <button onClick={() => window.location.href = '/goals/new'}>
                    Create Goal Manually
                </button>
            </div>
        );
    }

    return (
        <div className="suggestions-step">
            <h2 className="suggestions-title">Your Personalized Goals</h2>
            <p className="suggestions-subtitle">Pick the one that resonates most with you</p>

            <div className="suggestions-grid">
                {suggestions.map((goal, index) => (
                    <div
                        key={index}
                        className={`suggestion-card ${selectedIndex === index ? 'selected' : ''}`}
                        onClick={() => handleSelect(goal, index)}
                    >
                        <div className="suggestion-domain">{goal.domain}</div>
                        <h3 className="suggestion-title">{goal.title}</h3>

                        <div className="suggestion-states">
                            <div className="suggestion-state">
                                <strong>From:</strong> {goal.currentState}
                            </div>
                            <div className="suggestion-arrow">→</div>
                            <div className="suggestion-state">
                                <strong>To:</strong> {goal.desiredState}
                            </div>
                        </div>

                        <div className="suggestion-why">
                            <strong>Why this works for you:</strong>
                            <p>{goal.why}</p>
                        </div>

                        <div className="suggestion-difficulty">
                            Difficulty: {goal.difficulty}/10
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .suggestions-step {
                    width: 100%;
                    animation: fadeIn 0.5s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .suggestions-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 8px;
                    text-align: center;
                }

                .suggestions-subtitle {
                    font-size: 1rem;
                    color: var(--color-text-muted);
                    margin-bottom: 32px;
                    text-align: center;
                }

                .suggestions-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .suggestion-card {
                    background: var(--color-surface);
                    border: 2px solid var(--color-border);
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .suggestion-card:hover {
                    border-color: #3b82f6;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }

                .suggestion-card.selected {
                    border-color: #3b82f6;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
                }

                .suggestion-domain {
                    display: inline-block;
                    background: #3b82f6;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                }

                .suggestion-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 16px;
                }

                .suggestion-states {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 16px;
                    font-size: 0.9rem;
                }

                .suggestion-state {
                    color: var(--color-text);
                }

                .suggestion-arrow {
                    color: #3b82f6;
                    font-size: 1.25rem;
                    margin: 4px 0;
                }

                .suggestion-why {
                    background: var(--color-surface-2);
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    margin-bottom: 12px;
                }

                .suggestion-why strong {
                    display: block;
                    margin-bottom: 4px;
                    color: var(--color-text);
                }

                .suggestion-why p {
                    color: var(--color-text-muted);
                    margin: 0;
                    line-height: 1.5;
                }

                .suggestion-difficulty {
                    font-size: 0.875rem;
                    color: var(--color-text-muted);
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}
