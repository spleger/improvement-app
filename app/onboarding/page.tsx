'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeStep from './components/WelcomeStep';
import SurveyStep from './components/SurveyStep';
import AnalysisStep from './components/AnalysisStep';
import SuggestionsStep from './components/SuggestionsStep';
import CustomizeStep from './components/CustomizeStep';
import FirstChallengeStep from './components/FirstChallengeStep';

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [surveyAnswers, setSurveyAnswers] = useState({});
    const [goalSuggestions, setGoalSuggestions] = useState([]);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [customizedGoal, setCustomizedGoal] = useState(null);
    const [firstChallenge, setFirstChallenge] = useState(null);

    const totalSteps = 6;

    const handleWelcomeComplete = () => {
        setCurrentStep(2);
    };

    const handleSurveyComplete = async (answers: any) => {
        setSurveyAnswers(answers);
        setCurrentStep(3); // Go to analysis step

        // Fetch AI suggestions
        try {
            const res = await fetch('/api/onboarding/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });

            const data = await res.json();
            if (data.success) {
                setGoalSuggestions(data.data.suggestions);
                setCurrentStep(4); // Move to suggestions step
            } else {
                // Fallback if API fails
                setGoalSuggestions([]);
                setCurrentStep(4);
            }
        } catch (error) {
            console.error('Failed to get goal suggestions:', error);
            setCurrentStep(4);
        }
    };

    const handleGoalSelect = (goal: any) => {
        setSelectedGoal(goal);
        setCurrentStep(5);
    };

    const handleGoalCustomize = async (goal: any) => {
        setCustomizedGoal(goal);

        // Create the goal in the database
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: goal.title,
                    currentState: goal.currentState,
                    desiredState: goal.desiredState,
                    domainName: goal.domain,
                    difficultyLevel: goal.difficulty,
                    realityShiftEnabled: false
                })
            });

            const data = await res.json();
            if (data.success && data.data.goal) {
                const createdGoal = data.data.goal;

                // Generate first challenge
                const challengeRes = await fetch('/api/challenges/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        goalId: createdGoal.id,
                        count: 1
                    })
                });

                const challengeData = await challengeRes.json();
                if (challengeData.success && challengeData.data.challenges?.length > 0) {
                    setFirstChallenge(challengeData.data.challenges[0]);
                }
            }

            setCurrentStep(6);
        } catch (error) {
            console.error('Failed to create goal:', error);
            setCurrentStep(6); // Continue anyway
        }
    };

    const handleComplete = async () => {
        // Mark onboarding as complete (fire and forget)
        fetch('/api/onboarding/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                surveyData: {
                    answers: surveyAnswers,
                    selectedGoal: customizedGoal,
                    completedAt: new Date().toISOString()
                }
            })
        }).catch(err => console.error('Onboarding complete error', err));

        // Redirect immediately
        window.location.href = '/';
    };

    const handleSkip = () => {
        window.location.href = '/';
    };

    return (
        <div className="onboarding-container">
            {/* Progress Bar */}
            <div className="onboarding-progress-bar">
                <div
                    className="onboarding-progress-fill"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
            </div>

            {/* Steps */}
            <div className="onboarding-content">
                {currentStep === 1 && <WelcomeStep onContinue={handleWelcomeComplete} />}
                {currentStep === 2 && <SurveyStep onComplete={handleSurveyComplete} />}
                {currentStep === 3 && <AnalysisStep />}
                {currentStep === 4 && (
                    <SuggestionsStep
                        suggestions={goalSuggestions}
                        onSelect={handleGoalSelect}
                    />
                )}
                {currentStep === 5 && (
                    <CustomizeStep
                        initialGoal={selectedGoal}
                        onSave={handleGoalCustomize}
                    />
                )}
                {currentStep === 6 && (
                    <FirstChallengeStep
                        challenge={firstChallenge}
                        onComplete={handleComplete}
                    />
                )}
            </div>

            {/* Skip Option */}
            {currentStep < 6 && (
                <button onClick={handleSkip} className="onboarding-skip-btn">
                    Skip to Dashboard →
                </button>
            )}

            <style jsx>{`
                .onboarding-container {
                    min-height: 100vh;
                    background: var(--color-background);
                    padding: 0;
                    position: relative;
                }

                .onboarding-progress-bar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: var(--color-surface-2);
                    z-index: 100;
                }

                .onboarding-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    transition: width 0.5s ease;
                }

                .onboarding-content {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    min-height: calc(100vh - 60px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .onboarding-skip-btn {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: transparent;
                    border: none;
                    color: var(--color-text-muted);
                    font-size: 0.875rem;
                    cursor: pointer;
                    text-decoration: underline;
                    padding: 8px;
                }

                .onboarding-skip-btn:hover {
                    color: var(--color-text);
                }

                @media (max-width: 640px) {
                    .onboarding-content {
                        padding: 20px 16px;
                    }
                }
            `}</style>
        </div>
    );
}
