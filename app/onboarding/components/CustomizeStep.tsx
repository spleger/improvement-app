'use client';

import { useState } from 'react';

interface CustomizeStepProps {
    initialGoal: any;
    onSave: (goal: any) => void;
}

export default function CustomizeStep({ initialGoal, onSave }: CustomizeStepProps) {
    const [goal, setGoal] = useState({
        title: initialGoal?.title || '',
        currentState: initialGoal?.currentState || '',
        desiredState: initialGoal?.desiredState || '',
        difficulty: initialGoal?.difficulty || 5,
        domain: initialGoal?.domain || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(goal);
    };

    return (
        <div className="customize-step">
            <h2 className="customize-title">Customize Your Goal</h2>
            <p className="customize-subtitle">Feel free to adjust these details</p>

            <form onSubmit={handleSubmit} className="customize-form">
                <div className="customize-field">
                    <label>Goal Title</label>
                    <input
                        type="text"
                        value={goal.title}
                        onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                        required
                    />
                </div>

                <div className="customize-field">
                    <label>Current State</label>
                    <textarea
                        value={goal.currentState}
                        onChange={(e) => setGoal({ ...goal, currentState: e.target.value })}
                        rows={2}
                        required
                    />
                </div>

                <div className="customize-field">
                    <label>Desired State (in 30 days)</label>
                    <textarea
                        value={goal.desiredState}
                        onChange={(e) => setGoal({ ...goal, desiredState: e.target.value })}
                        rows={2}
                        required
                    />
                </div>

                <div className="customize-field">
                    <label>Difficulty Level: {goal.difficulty}/10</label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={goal.difficulty}
                        onChange={(e) => setGoal({ ...goal, difficulty: parseInt(e.target.value) })}
                    />
                </div>

                <button type="submit" className="customize-submit-btn">
                    Create Goal & Get First Challenge
                </button>
            </form>

            <style jsx>{`
                .customize-step {
                    width: 100%;
                    animation: fadeIn 0.5s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .customize-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 8px;
                }

                .customize-subtitle {
                    font-size: 1rem;
                    color: var(--color-text-muted);
                    margin-bottom: 32px;
                }

                .customize-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .customize-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .customize-field label {
                    font-weight: 600;
                    color: var(--color-text);
                    font-size: 0.95rem;
                }

                .customize-field input[type="text"],
                .customize-field textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid var(--color-border);
                    border-radius: 8px;
                    background: var(--color-surface);
                    color: var(--color-text);
                    font-size: 0.95rem;
                    font-family: inherit;
                }

                .customize-field input[type="text"]:focus,
                .customize-field textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .customize-field input[type="range"] {
                    width: 100%;
                }

                .customize-submit-btn {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 8px;
                }

                .customize-submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                }
            `}</style>
        </div>
    );
}
