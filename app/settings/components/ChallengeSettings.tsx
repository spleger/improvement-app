'use client';

import React from 'react';

interface ChallengeSettingsProps {
    prefs: {
        preferredDifficulty?: number;
        challengesPerDay?: number;
        challengeLengthPreference?: string;
        preferredChallengeTime?: string;
        realityShiftEnabled?: boolean;
        focusAreas?: string[];
        avoidAreas?: string[];
    };
    updatePref: (key: string, value: any) => void;
    focusInput: string;
    setFocusInput: (value: string) => void;
    addFocusArea: () => void;
    removeFocusArea: (area: string) => void;
    avoidInput: string;
    setAvoidInput: (value: string) => void;
    addAvoidArea: () => void;
    removeAvoidArea: (area: string) => void;
}

const CHALLENGE_LENGTHS = [
    { value: 'short', label: '5-15 min', emoji: '\u26A1' },
    { value: 'medium', label: '15-30 min', emoji: '\u{1F3AF}' },
    { value: 'long', label: '30+ min', emoji: '\u{1F3CB}\uFE0F' }
];

const CHALLENGE_TIMES = [
    { value: 'morning', label: 'Morning', emoji: '\u{1F305}' },
    { value: 'afternoon', label: 'Afternoon', emoji: '\u2600\uFE0F' },
    { value: 'evening', label: 'Evening', emoji: '\u{1F319}' },
    { value: 'anytime', label: 'Anytime', emoji: '\u{1F504}' }
];

export default function ChallengeSettings({ prefs, updatePref, focusInput, setFocusInput, addFocusArea, removeFocusArea, avoidInput, setAvoidInput, addAvoidArea, removeAvoidArea }: ChallengeSettingsProps) {
    return (
        <>
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">{'\u{1F3AF}'} Challenge Generation</h2>

                <div className="form-group">
                    <label className="form-label">Default Difficulty Level</label>
                    <div className="slider-container">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="any"
                            value={prefs.preferredDifficulty}
                            onChange={e => updatePref('preferredDifficulty', Math.round(parseFloat(e.target.value)))}
                            className="slider"
                            style={{ '--slider-progress': `${((prefs.preferredDifficulty! - 1) / 9) * 100}%`, padding: '16px 0' } as React.CSSProperties}
                        />
                        <div className="slider-labels">
                            <span>Easy</span>
                            <span>Hard</span>
                        </div>
                        <div className="slider-value">{prefs.preferredDifficulty}/10</div>
                        <p className="text-tiny text-muted" style={{ marginTop: 'var(--spacing-xs)' }}>
                            {prefs.preferredDifficulty! <= 3 ? 'Gentle start - building momentum' :
                                prefs.preferredDifficulty! <= 6 ? 'Moderate - balanced challenge' :
                                    prefs.preferredDifficulty! <= 8 ? 'Intense - pushing boundaries' :
                                        'Extreme - maximum growth'}
                        </p>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Challenges Per Day</label>
                    <div className="flex gap-sm">
                        {[1, 2, 3, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => updatePref('challengesPerDay', n)}
                                className={`btn ${prefs.challengesPerDay === n ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    flex: 1,
                                    border: prefs.challengesPerDay === n ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    fontWeight: 'bold'
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Preferred Challenge Length</label>
                    <div className="flex gap-sm">
                        {CHALLENGE_LENGTHS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updatePref('challengeLengthPreference', opt.value)}
                                className={`btn ${prefs.challengeLengthPreference === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    padding: '0.75rem',
                                    border: prefs.challengeLengthPreference === opt.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    fontWeight: prefs.challengeLengthPreference === opt.value ? 'bold' : 'normal'
                                }}
                            >
                                <span>{opt.emoji}</span>
                                <span className="text-tiny">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Best Time for Challenges</label>
                    <div className="flex gap-sm flex-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
                        {CHALLENGE_TIMES.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updatePref('preferredChallengeTime', opt.value)}
                                className={`btn ${prefs.preferredChallengeTime === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-xs)',
                                    border: prefs.preferredChallengeTime === opt.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    fontWeight: prefs.preferredChallengeTime === opt.value ? 'bold' : 'normal'
                                }}
                            >
                                <span>{opt.emoji}</span>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="flex items-center gap-md" style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <div className="heading-5">{'\u26A1'} Reality Shift Mode</div>
                            <div className="text-small text-muted">
                                Enable extreme, life-changing challenges that push you far outside your comfort zone
                            </div>
                        </div>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={prefs.realityShiftEnabled}
                                onChange={e => updatePref('realityShiftEnabled', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </div>
                    </label>
                </div>
            </section>

            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">{'\u{1F3AA}'} Focus Areas</h2>
                <p className="text-small text-muted mb-md">
                    Tell the AI what you want to focus on or avoid
                </p>

                <div className="form-group">
                    <label className="form-label">I want challenges that focus on:</label>
                    <div className="flex gap-sm mb-sm">
                        <input
                            type="text"
                            value={focusInput}
                            onChange={e => setFocusInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addFocusArea()}
                            placeholder="e.g., speaking, morning routines, facing fears"
                            className="form-input"
                            style={{ flex: 1 }}
                            autoComplete="off"
                        />
                        <button onClick={addFocusArea} className="btn btn-secondary">Add</button>
                    </div>
                    {prefs.focusAreas && prefs.focusAreas.length > 0 && (
                        <div className="flex gap-sm flex-wrap">
                            {prefs.focusAreas.map(area => (
                                <span key={area} className="tag" style={{
                                    background: 'var(--color-surface)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {area}
                                    <button
                                        onClick={() => removeFocusArea(area)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                                    >
                                        {'\u2715'}
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <label className="form-label">I want to avoid challenges about:</label>
                    <div className="flex gap-sm mb-sm">
                        <input
                            type="text"
                            value={avoidInput}
                            onChange={e => setAvoidInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addAvoidArea()}
                            placeholder="e.g., public speaking, cold water, heights"
                            className="form-input"
                            style={{ flex: 1 }}
                            autoComplete="off"
                        />
                        <button onClick={addAvoidArea} className="btn btn-secondary">Add</button>
                    </div>
                    {prefs.avoidAreas && prefs.avoidAreas.length > 0 && (
                        <div className="flex gap-sm flex-wrap">
                            {prefs.avoidAreas.map(area => (
                                <span key={area} className="tag" style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {area}
                                    <button
                                        onClick={() => removeAvoidArea(area)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                                    >
                                        {'\u2715'}
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
