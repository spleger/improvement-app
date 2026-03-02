'use client';

import { useState, useCallback } from 'react';
import { MessageCircle, Sparkles, Radio } from 'lucide-react';
import Link from 'next/link';
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

    // If a mode is selected, render it full screen
    if (selectedMode === 'interview') {
        return <InterviewChat onComplete={handleInterviewComplete} onBack={handleBackToModeSelection} />;
    }

    if (selectedMode === 'expert') {
        return <ExpertChat onBack={handleBackToModeSelection} />;
    }

    // Otherwise render selection menu
    return (
        <div className="ai-conversation">
            {/* Back button - goes to main survey mode selection */}
            <button
                onClick={onBack}
                className="btn btn-ghost mb-md text-small"
            >
                ← Back to options
            </button>

            {/* Sub-mode Selection */}
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
                    className="mode-card card mb-md"
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

                <Link
                    href="/expert/live"
                    className="mode-card card"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <div className="mode-icon" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                        <Radio size={28} />
                    </div>
                    <div className="mode-content">
                        <h3 className="mode-title">Live Voice Mode</h3>
                        <p className="mode-description text-secondary text-small">
                            Hands-free conversation -- just speak naturally, the AI listens and responds
                        </p>
                    </div>
                </Link>
            </div>

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
            `}</style>
        </div>
    );
}
