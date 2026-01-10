'use client';

import { useEffect, useState } from 'react';

interface WelcomeStepProps {
    onContinue: () => void;
}

export default function WelcomeStep({ onContinue }: WelcomeStepProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        // Auto-continue after 3 seconds
        const timer = setTimeout(() => {
            onContinue();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onContinue]);

    return (
        <div className={`welcome-step ${isVisible ? 'visible' : ''}`}>
            <div className="welcome-icon">🚀</div>
            <h1 className="welcome-title">Welcome to Your Transformation Journey!</h1>
            <p className="welcome-subtitle">
                Let's build a personalized plan that works for you.
            </p>
            <p className="welcome-time">This will take less than 2 minutes</p>

            <button onClick={onContinue} className="welcome-btn">
                Get Started
            </button>

            <style jsx>{`
                .welcome-step {
                    text-align: center;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s ease;
                    width: 100%;
                }

                .welcome-step.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .welcome-icon {
                    font-size: 4rem;
                    margin-bottom: 24px;
                    animation: bounce 2s infinite;
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .welcome-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 16px;
                    line-height: 1.2;
                }

                .welcome-subtitle {
                    font-size: 1.125rem;
                    color: var(--color-text-muted);
                    margin-bottom: 8px;
                }

                .welcome-time {
                    font-size: 0.875rem;
                    color: var(--color-text-muted);
                    margin-bottom: 32px;
                    font-style: italic;
                }

                .welcome-btn {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    border: none;
                    padding: 14px 32px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .welcome-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                }

                @media (max-width: 640px) {
                    .welcome-title {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
