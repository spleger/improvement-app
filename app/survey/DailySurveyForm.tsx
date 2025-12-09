'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DailySurveyForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showExtended, setShowExtended] = useState(false);
    const [formData, setFormData] = useState({
        // Minimum fields
        energyLevel: 5,
        motivationLevel: 5,
        overallMood: 5,
        // Extended fields
        sleepQuality: 5,
        stressLevel: 5,
        biggestWin: '',
        biggestBlocker: '',
        gratitudeNote: '',
        tomorrowIntention: ''
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                completionLevel: showExtended ? 'extended' : 'minimum'
            };

            // Only include extended fields if shown
            if (!showExtended) {
                delete (payload as any).sleepQuality;
                delete (payload as any).stressLevel;
                delete (payload as any).biggestWin;
                delete (payload as any).biggestBlocker;
                delete (payload as any).gratitudeNote;
                delete (payload as any).tomorrowIntention;
            }

            const response = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                router.push('/?surveyComplete=true');
                router.refresh();
            } else {
                throw new Error('Failed to submit survey');
            }
        } catch (error) {
            console.error('Error submitting survey:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const SliderQuestion = ({
        label,
        value,
        onChange,
        leftEmoji,
        rightEmoji
    }: {
        label: string;
        value: number;
        onChange: (v: number) => void;
        leftEmoji: string;
        rightEmoji: string;
    }) => (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div className="slider-container">
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    className="slider"
                />
                <div className="slider-labels">
                    <span>{leftEmoji}</span>
                    <span>{rightEmoji}</span>
                </div>
                <div className="slider-value">{value}</div>
            </div>
        </div>
    );

    return (
        <>
            {/* Minimum Survey */}
            <div className="card mb-lg">
                <SliderQuestion
                    label="How's your energy today?"
                    value={formData.energyLevel}
                    onChange={v => setFormData(prev => ({ ...prev, energyLevel: v }))}
                    leftEmoji="😴"
                    rightEmoji="💪"
                />

                <SliderQuestion
                    label="Motivation level?"
                    value={formData.motivationLevel}
                    onChange={v => setFormData(prev => ({ ...prev, motivationLevel: v }))}
                    leftEmoji="😑"
                    rightEmoji="🔥"
                />

                <SliderQuestion
                    label="Overall mood?"
                    value={formData.overallMood}
                    onChange={v => setFormData(prev => ({ ...prev, overallMood: v }))}
                    leftEmoji="😔"
                    rightEmoji="😊"
                />
            </div>

            {/* Expand Button */}
            {!showExtended && (
                <button
                    onClick={() => setShowExtended(true)}
                    className="btn btn-ghost w-full mb-lg"
                >
                    + Add more details (optional)
                </button>
            )}

            {/* Extended Survey */}
            {showExtended && (
                <div className="card mb-lg animate-slide-up">
                    <SliderQuestion
                        label="Sleep quality last night?"
                        value={formData.sleepQuality}
                        onChange={v => setFormData(prev => ({ ...prev, sleepQuality: v }))}
                        leftEmoji="😫"
                        rightEmoji="✨"
                    />

                    <SliderQuestion
                        label="Stress level?"
                        value={formData.stressLevel}
                        onChange={v => setFormData(prev => ({ ...prev, stressLevel: v }))}
                        leftEmoji="🧘"
                        rightEmoji="😰"
                    />

                    <div className="form-group">
                        <label className="form-label">Biggest win today?</label>
                        <input
                            type="text"
                            value={formData.biggestWin}
                            onChange={e => setFormData(prev => ({ ...prev, biggestWin: e.target.value }))}
                            placeholder="What went well?"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">What blocked you? (if anything)</label>
                        <input
                            type="text"
                            value={formData.biggestBlocker}
                            onChange={e => setFormData(prev => ({ ...prev, biggestBlocker: e.target.value }))}
                            placeholder="Any challenges?"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gratitude moment</label>
                        <input
                            type="text"
                            value={formData.gratitudeNote}
                            onChange={e => setFormData(prev => ({ ...prev, gratitudeNote: e.target.value }))}
                            placeholder="What are you grateful for?"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tomorrow's intention</label>
                        <input
                            type="text"
                            value={formData.tomorrowIntention}
                            onChange={e => setFormData(prev => ({ ...prev, tomorrowIntention: e.target.value }))}
                            placeholder="What will you focus on?"
                            className="form-input"
                        />
                    </div>

                    <button
                        onClick={() => setShowExtended(false)}
                        className="btn btn-ghost text-small"
                    >
                        − Collapse extended fields
                    </button>
                </div>
            )}

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-success btn-large w-full"
            >
                {isSubmitting ? 'Saving...' : '✓ Submit Check-in'}
            </button>

            <p className="text-tiny text-muted text-center mt-md">
                Takes about {showExtended ? '2 minutes' : '15 seconds'}
            </p>
        </>
    );
}
