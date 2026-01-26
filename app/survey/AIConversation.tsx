'use client';

import { useState, useCallback } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import InterviewChat from './InterviewChat';
import ExpertChat from '../expert/ExpertChat';

type AIMode = 'interview' | 'expert' | null;

interface AIConversationProps {
    onBack: () => void;
}

export default function AIConversation({ onBack }: AIConversationProps) {
    const [selectedMode, setSelectedMode] = useState<AIMode>(null);
    const [interviewCompleted, setInterviewCompleted] = useState(false);

    const handleBackToModeSelection = useCallback(() => {
        setSelectedMode(null);
        setInterviewCompleted(false);
    }, []);

    const handleInterviewComplete = useCallback(() => {
        setInterviewCompleted(true);
    }, []);

    return (
        <div className="ai-conversation">
            {/* Back button - goes to mode selection or main survey mode selection */}
            <button
                onClick={selectedMode === null ? onBack : handleBackToModeSelection}
                className="btn btn-ghost mb-md text-small"
            >
                ← {selectedMode === null ? 'Change mode' : 'Back to AI options'}
            </button>

            {/* Sub-mode Selection */}
            {selectedMode === null && (
                <div className="mode-selection animate-slide-up">
                    <div className="selection-header">
                        <h3 className="heading-3">Choose your conversation style</h3>
                        <p className="text-secondary text-small">
                            How would you like to talk with your AI coach today?
                        </p>
                    </div>

                    <button
                        onClick={() => setSelectedMode('interview')}
                        className="mode-card card mb-md"
                    >
                        <div className="mode-icon interview-icon">
                            <MessageCircle size={28} />
                        </div>
                        <div className="mode-content">
                            <h3 className="mode-title">Guided Interview</h3>
                            <p className="mode-description text-secondary text-small">
                                AI guides you through questions about your goals, challenges, habits, and mood
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedMode('expert')}
                        className="mode-card card"
                    >
                        <div className="mode-icon expert-icon">
                            <Sparkles size={28} />
                        </div>
                        <div className="mode-content">
                            <h3 className="mode-title">Expert Chat</h3>
                            <p className="mode-description text-secondary text-small">
                                Free-form conversation with your AI coach on any topic
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* Interview Mode */}
            {selectedMode === 'interview' && (
                <InterviewChat onComplete={handleInterviewComplete} />
            )}

            {/* Expert Chat Mode */}
            {selectedMode === 'expert' && (
                <div className="expert-chat-wrapper">
                    <ExpertChat />
                </div>
            )}

            <style jsx>{`
                .ai-conversation {
                    width: 100%;
                }

                .selection-header {
                    text-align: center;
                    margin-bottom: var(--spacing-lg);
                }

                .selection-header .heading-3 {
                    margin-bottom: var(--spacing-xs);
                }

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
                    width: 60px;
                    height: 60px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: white;
                }

                .mode-icon.interview-icon {
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                }

                .mode-icon.expert-icon {
                    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
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

                .expert-chat-wrapper {
                    width: 100%;
                }
            `}</style>
        </div>
    );
}
