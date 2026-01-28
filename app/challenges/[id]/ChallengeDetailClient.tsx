'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChallengeInfo {
    title: string;
    description: string;
    difficulty: number;
    personalizationNotes?: string;
    domain?: string;
    tips?: string[];
}

interface Props {
    challengeId: string;
    isCompleted: boolean;
    challenge: ChallengeInfo;
}

// Generate dynamic tips based on challenge content
function getDynamicTips(challenge: ChallengeInfo): string[] {
    const tips: string[] = [];

    // Difficulty-based tips
    if (challenge.difficulty <= 3) {
        tips.push('This is a gentle challenge - perfect for building momentum');
        tips.push('Focus on completing it rather than perfecting it');
    } else if (challenge.difficulty <= 6) {
        tips.push('Set aside focused time without distractions');
        tips.push('Break it down into smaller steps if needed');
    } else {
        tips.push('This is a challenging one - prepare mentally first');
        tips.push('Consider tackling this when your energy is highest');
        tips.push('It\'s okay to take breaks - just don\'t give up');
    }

    // Add personalization notes as a tip if available
    if (challenge.personalizationNotes) {
        const firstNote = challenge.personalizationNotes.split('\n')[0];
        if (firstNote && firstNote.length > 10) {
            tips.push(firstNote.replace(/^\d+\.\s*/, '').trim());
        }
    }

    // Universal tips
    tips.push('Record a voice diary after to capture your experience');

    return tips.slice(0, 4); // Limit to 4 tips
}

export default function ChallengeDetailClient({ challengeId, isCompleted, challenge }: Props) {
    const router = useRouter();
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        difficultyFelt: 5,
        satisfaction: 5,
        notes: ''
    });

    // Use AI-generated tips if available, otherwise fall back to dynamic tips
    const displayTips = challenge.tips && challenge.tips.length > 0
        ? challenge.tips.slice(0, 4)
        : getDynamicTips(challenge);

    const handleComplete = async () => {
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/challenges/${challengeId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                router.push('/?completed=true');
                router.refresh();
            } else {
                throw new Error('Failed to complete challenge');
            }
        } catch (error) {
            console.error('Error completing challenge:', error);
            alert('Failed to complete challenge. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        if (!confirm('Are you sure you want to skip this challenge?')) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/challenges/${challengeId}/skip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Skipped by user' })
            });

            if (response.ok) {
                router.push('/?skipped=true');
                router.refresh();
            } else {
                throw new Error('Failed to skip challenge');
            }
        } catch (error) {
            console.error('Error skipping challenge:', error);
            alert('Failed to skip challenge.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="card text-center" style={{ background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(40, 167, 69, 0.2) 100%)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h3 className="heading-4 mb-sm">Challenge Completed!</h3>
                <p className="text-secondary">
                    Great job! You've already completed this challenge.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Main Action Buttons */}
            <div className="flex gap-md mb-lg">
                <button
                    onClick={() => setShowCompletionModal(true)}
                    className="btn btn-success btn-large"
                    style={{ flex: 1 }}
                >
                    ✓ Mark Complete
                </button>
                <button
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="btn btn-ghost"
                >
                    Skip
                </button>
            </div>

            {/* Tips Section - AI-generated with fallback to dynamic tips */}
            <div className="card card-surface">
                <h3 className="heading-4 mb-md">💡 Tips for Success</h3>
                <ul style={{ paddingLeft: '1.5rem' }}>
                    {displayTips.map((tip, index) => (
                        <li key={index} className={`text-secondary ${index < displayTips.length - 1 ? 'mb-sm' : ''}`}>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Completion Modal - Fixed Layout */}
            {showCompletionModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCompletionModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 0
                    }}
                >
                    <div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--color-background)',
                            borderRadius: '24px 24px 0 0',
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Modal Header - Fixed */}
                        <div style={{
                            padding: '1.5rem 1.5rem 1rem',
                            borderBottom: '1px solid var(--color-border)',
                            flexShrink: 0
                        }}>
                            <h2 className="heading-3 text-center">🎉 Challenge Complete!</h2>
                            <p className="text-center text-muted">Quick feedback to help the AI learn</p>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {/* Difficulty Felt */}
                            <div className="form-group">
                                <label className="form-label">How difficult did it feel?</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span>😌</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.difficultyFelt}
                                        onChange={e => setFormData(prev => ({ ...prev, difficultyFelt: parseInt(e.target.value) }))}
                                        className="slider"
                                        style={{ flex: 1 }}
                                    />
                                    <span>😓</span>
                                    <span className="heading-5" style={{ width: '40px', textAlign: 'center' }}>
                                        {formData.difficultyFelt}
                                    </span>
                                </div>
                            </div>

                            {/* Satisfaction */}
                            <div className="form-group">
                                <label className="form-label">How satisfied are you?</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span>😕</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.satisfaction}
                                        onChange={e => setFormData(prev => ({ ...prev, satisfaction: parseInt(e.target.value) }))}
                                        className="slider"
                                        style={{ flex: 1 }}
                                    />
                                    <span>🤩</span>
                                    <span className="heading-5" style={{ width: '40px', textAlign: 'center' }}>
                                        {formData.satisfaction}
                                    </span>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="form-label">Quick note (optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="How did you feel? What did you learn?"
                                    className="form-input form-textarea"
                                    rows={2}
                                    style={{ resize: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Modal Footer - Fixed at Bottom */}
                        <div style={{
                            padding: '1rem 1.5rem 1.5rem',
                            borderTop: '1px solid var(--color-border)',
                            flexShrink: 0,
                            background: 'var(--color-background)'
                        }}>
                            <button
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="btn btn-success w-full"
                                style={{
                                    padding: '1rem',
                                    fontSize: '1.125rem',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                {isSubmitting ? '⏳ Saving...' : '✅ Complete Challenge!'}
                            </button>
                            <button
                                onClick={() => setShowCompletionModal(false)}
                                className="btn btn-ghost w-full"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
