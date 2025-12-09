'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Domain {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
    description: string | null;
    examples: string[];
}

interface Props {
    domains: Domain[];
}

const domainIcons: Record<string, string> = {
    languages: '🗣️',
    stretch: '🧘',
    heart: '💜',
    users: '👥',
    dumbbell: '💪',
    shield: '🛡️',
    wrench: '🔧',
    repeat: '🔁'
};

export default function NewGoalForm({ domains }: Props) {
    const router = useRouter();
    const [step, setStep] = useState<'domain' | 'details' | 'preferences'>('domain');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        domainId: null as number | null,
        title: '',
        description: '',
        currentState: '',
        desiredState: '',
        difficultyLevel: 5,
        realityShiftEnabled: false
    });

    const selectedDomain = domains.find(d => d.id === formData.domainId);

    const handleDomainSelect = (domainId: number) => {
        setFormData(prev => ({ ...prev, domainId }));
        setStep('details');
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.domainId) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                router.push('/?goalCreated=true');
                router.refresh();
            } else {
                throw new Error('Failed to create goal');
            }
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Failed to create goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Step 1: Domain Selection */}
            {step === 'domain' && (
                <div className="animate-slide-up">
                    <h2 className="heading-4 mb-lg">Choose your transformation area</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        {domains.map(domain => (
                            <button
                                key={domain.id}
                                onClick={() => handleDomainSelect(domain.id)}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    border: formData.domainId === domain.id ? `2px solid ${domain.color}` : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                    {domainIcons[domain.icon || ''] || '🎯'}
                                </div>
                                <div className="heading-4">{domain.name}</div>
                                <p className="text-small text-muted" style={{ marginTop: '0.25rem' }}>
                                    {domain.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Goal Details */}
            {step === 'details' && (
                <div className="animate-slide-up">
                    <button onClick={() => setStep('domain')} className="btn btn-ghost mb-lg">
                        ← Change domain
                    </button>

                    {selectedDomain && (
                        <div className="card card-surface mb-lg flex gap-md items-center">
                            <span style={{ fontSize: '2rem' }}>
                                {domainIcons[selectedDomain.icon || ''] || '🎯'}
                            </span>
                            <div>
                                <div className="heading-4">{selectedDomain.name}</div>
                                <div className="text-small text-muted">{selectedDomain.description}</div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">What's your specific goal? *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder={selectedDomain?.examples[0] || "e.g., Learn conversational German"}
                            className="form-input"
                        />
                        {selectedDomain && selectedDomain.examples.length > 0 && (
                            <div className="text-small text-muted mt-sm">
                                Examples: {selectedDomain.examples.slice(0, 3).join(', ')}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Where are you starting from?</label>
                        <textarea
                            value={formData.currentState}
                            onChange={e => setFormData(prev => ({ ...prev, currentState: e.target.value }))}
                            placeholder="Describe your current state honestly..."
                            className="form-input form-textarea"
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Where do you want to be in 30 days?</label>
                        <textarea
                            value={formData.desiredState}
                            onChange={e => setFormData(prev => ({ ...prev, desiredState: e.target.value }))}
                            placeholder="Be specific about what success looks like..."
                            className="form-input form-textarea"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-md">
                        <button
                            onClick={() => setStep('preferences')}
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={!formData.title}
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Preferences */}
            {step === 'preferences' && (
                <div className="animate-slide-up">
                    <button onClick={() => setStep('details')} className="btn btn-ghost mb-lg">
                        ← Back
                    </button>

                    <div className="form-group">
                        <label className="form-label">Comfort with challenge difficulty</label>
                        <p className="text-small text-muted mb-md">
                            How intense should your daily challenges be?
                        </p>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.difficultyLevel}
                                onChange={e => setFormData(prev => ({ ...prev, difficultyLevel: parseInt(e.target.value) }))}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>Gentle</span>
                                <span>Intense</span>
                            </div>
                            <div className="slider-value">{formData.difficultyLevel}/10</div>
                        </div>
                    </div>

                    <div className="form-group">
                        <div
                            className="card"
                            style={{
                                cursor: 'pointer',
                                border: formData.realityShiftEnabled ? '2px solid #f12711' : '2px solid transparent',
                                background: formData.realityShiftEnabled ? 'linear-gradient(135deg, rgba(241, 39, 17, 0.05) 0%, rgba(245, 175, 25, 0.1) 100%)' : undefined
                            }}
                            onClick={() => setFormData(prev => ({ ...prev, realityShiftEnabled: !prev.realityShiftEnabled }))}
                        >
                            <div className="flex items-center gap-md">
                                <span style={{ fontSize: '2rem' }}>⚡</span>
                                <div style={{ flex: 1 }}>
                                    <div className="heading-4">Reality Shift Mode</div>
                                    <p className="text-small text-muted">
                                        Include extreme challenges that push you far outside your comfort zone
                                    </p>
                                </div>
                                <div style={{
                                    width: '48px',
                                    height: '28px',
                                    borderRadius: '14px',
                                    background: formData.realityShiftEnabled ? '#f12711' : '#ddd',
                                    position: 'relative',
                                    transition: 'background 0.2s'
                                }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '12px',
                                        background: 'white',
                                        position: 'absolute',
                                        top: '2px',
                                        left: formData.realityShiftEnabled ? '22px' : '2px',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="card card-highlight mb-lg">
                        <h3 className="heading-4 mb-md">Your 30-Day Goal</h3>
                        <p className="text-body mb-sm"><strong>{formData.title}</strong></p>
                        {formData.currentState && (
                            <p className="text-small text-muted mb-sm">
                                From: {formData.currentState.substring(0, 100)}...
                            </p>
                        )}
                        {formData.desiredState && (
                            <p className="text-small text-muted">
                                To: {formData.desiredState.substring(0, 100)}...
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn btn-success btn-large w-full"
                    >
                        {isSubmitting ? 'Creating...' : '🚀 Start My Transformation'}
                    </button>
                </div>
            )}
        </>
    );
}
