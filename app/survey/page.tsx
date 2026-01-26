'use client';

import { useState } from 'react';
import Link from 'next/link';
import DailySurveyForm from './DailySurveyForm';
import AIConversation from './AIConversation';

type SurveyMode = 'survey' | 'ai' | null;

export default function SurveyPage() {
    const [selectedMode, setSelectedMode] = useState<SurveyMode>(null);

    const handleBackToModeSelection = () => {
        setSelectedMode(null);
    };

    return (
        <div className="page animate-fade-in">
            {/* Back button */}
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back
            </Link>

            {/* Header */}
            <div className="page-header">
                <h1 className="heading-2">📝 Daily Check-in</h1>
                <p className="text-secondary">
                    {selectedMode === null
                        ? 'Choose how you\'d like to check in today'
                        : 'How are you feeling today?'
                    }
                </p>
            </div>

            {/* Mode Selection */}
            {selectedMode === null && (
                <div className="mode-selection animate-slide-up">
                    <button
                        onClick={() => setSelectedMode('survey')}
                        className="mode-card card mb-md"
                    >
                        <div className="mode-icon">📋</div>
                        <div className="mode-content">
                            <h3 className="mode-title">Fill Survey</h3>
                            <p className="mode-description text-secondary text-small">
                                Quick sliders to track your mood, energy, and motivation
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedMode('ai')}
                        className="mode-card card"
                    >
                        <div className="mode-icon">🎙️</div>
                        <div className="mode-content">
                            <h3 className="mode-title">Talk to AI</h3>
                            <p className="mode-description text-secondary text-small">
                                Have a guided conversation with your AI coach
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* Survey Form */}
            {selectedMode === 'survey' && (
                <>
                    <button
                        onClick={handleBackToModeSelection}
                        className="btn btn-ghost mb-md text-small"
                    >
                        ← Change mode
                    </button>
                    <DailySurveyForm />
                </>
            )}

            {/* AI Conversation */}
            {selectedMode === 'ai' && (
                <AIConversation onBack={handleBackToModeSelection} />
            )}

            <style jsx>{`
                .mode-selection {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .mode-card {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg);
                    text-align: left;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    border: 2px solid transparent;
                    width: 100%;
                }

                .mode-card:hover {
                    border-color: var(--color-accent);
                    transform: translateY(-2px);
                }

                .mode-icon {
                    font-size: 2.5rem;
                    flex-shrink: 0;
                }

                .mode-content {
                    flex: 1;
                }

                .mode-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: var(--spacing-xs);
                    color: var(--color-text-primary);
                }

                .mode-description {
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
