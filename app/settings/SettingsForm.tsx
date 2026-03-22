'use client';

import { useState, useRef, useCallback } from 'react';

interface Preferences {
    displayName?: string;
    preferredDifficulty?: number;
    challengesPerDay?: number;
    realityShiftEnabled?: boolean;
    preferredChallengeTime?: string;
    focusAreas?: string[];
    avoidAreas?: string[];
    aiPersonality?: string;
    includeScientificBasis?: boolean;
    challengeLengthPreference?: string;
    notificationsEnabled?: boolean;
    dailyReminderTime?: string;
    streakReminders?: boolean;
    theme?: string;
    voiceId?: string | null;
}

const OPENAI_VOICES = [
    { id: 'alloy', label: 'Alloy', desc: 'Neutral and balanced' },
    { id: 'ash', label: 'Ash', desc: 'Warm and clear' },
    { id: 'coral', label: 'Coral', desc: 'Bright and expressive' },
    { id: 'echo', label: 'Echo', desc: 'Smooth and resonant' },
    { id: 'fable', label: 'Fable', desc: 'Storytelling quality' },
    { id: 'onyx', label: 'Onyx', desc: 'Deep and authoritative' },
    { id: 'nova', label: 'Nova', desc: 'Friendly and upbeat' },
    { id: 'sage', label: 'Sage', desc: 'Calm and thoughtful' },
    { id: 'shimmer', label: 'Shimmer', desc: 'Light and energetic' },
] as const;

const DEFAULT_PREFS: Preferences = {
    displayName: '',
    preferredDifficulty: 5,
    challengesPerDay: 1,
    realityShiftEnabled: false,
    preferredChallengeTime: 'morning',
    focusAreas: [],
    aiPersonality: 'encouraging',
    includeScientificBasis: true,
    challengeLengthPreference: 'medium',
    notificationsEnabled: true,
    dailyReminderTime: '09:00',
    streakReminders: true,
    theme: 'minimal',
    voiceId: 'nova',
};

export default function SettingsForm({ initialPreferences }: { initialPreferences: Preferences | null }) {
    const [prefs, setPrefs] = useState<Preferences>({ ...DEFAULT_PREFS, ...initialPreferences });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [focusInput, setFocusInput] = useState('');
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playVoiceSample = useCallback(async (voiceId: string) => {
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingVoice(voiceId);
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: 'Hello, I am your AI coach.', voiceId }),
            });
            if (!response.ok) {
                setPlayingVoice(null);
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
                setPlayingVoice(null);
                URL.revokeObjectURL(url);
                audioRef.current = null;
            };
            audio.onerror = () => {
                setPlayingVoice(null);
                URL.revokeObjectURL(url);
                audioRef.current = null;
            };
            await audio.play();
        } catch {
            setPlayingVoice(null);
        }
    }, []);

    const updatePref = (key: keyof Preferences, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const addFocusArea = () => {
        if (focusInput.trim() && !prefs.focusAreas?.includes(focusInput.trim())) {
            updatePref('focusAreas', [...(prefs.focusAreas || []), focusInput.trim()]);
            setFocusInput('');
        }
    };

    const removeFocusArea = (area: string) => {
        updatePref('focusAreas', (prefs.focusAreas || []).filter(a => a !== area));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs)
            });
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-form">
            {/* Profile Section */}
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">👤 Profile</h2>

                <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input
                        type="text"
                        value={prefs.displayName || ''}
                        onChange={e => updatePref('displayName', e.target.value)}
                        placeholder="Your name"
                        className="form-input"
                    />
                </div>
            </section>

            {/* Challenge Generation Section */}
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">🎯 Challenge Generation</h2>

                {/* Preferred Difficulty */}
                <div className="form-group">
                    <label className="form-label">Default Difficulty Level</label>
                    <div className="flex items-center gap-md">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={prefs.preferredDifficulty}
                            onChange={e => updatePref('preferredDifficulty', parseInt(e.target.value))}
                            className="slider"
                            style={{ flex: 1 }}
                        />
                        <span className="heading-5" style={{ width: '40px', textAlign: 'center' }}>
                            {prefs.preferredDifficulty}
                        </span>
                    </div>
                    <p className="text-tiny text-muted">
                        {prefs.preferredDifficulty! <= 3 ? 'Gentle start - building momentum' :
                            prefs.preferredDifficulty! <= 6 ? 'Moderate - balanced challenge' :
                                prefs.preferredDifficulty! <= 8 ? 'Intense - pushing boundaries' :
                                    'Extreme - maximum growth'}
                    </p>
                </div>

                {/* Challenges Per Day */}
                <div className="form-group">
                    <label className="form-label">Challenges Per Day</label>
                    <div className="flex gap-sm">
                        {[1, 2, 3, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => updatePref('challengesPerDay', n)}
                                className={`btn ${prefs.challengesPerDay === n ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Challenge Length */}
                <div className="form-group">
                    <label className="form-label">Preferred Challenge Length</label>
                    <div className="flex gap-sm">
                        {[
                            { value: 'short', label: '5-15 min', emoji: '⚡' },
                            { value: 'medium', label: '15-30 min', emoji: '🎯' },
                            { value: 'long', label: '30+ min', emoji: '🏋️' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updatePref('challengeLengthPreference', opt.value)}
                                className={`btn ${prefs.challengeLengthPreference === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1, flexDirection: 'column', padding: '0.75rem' }}
                            >
                                <span>{opt.emoji}</span>
                                <span className="text-tiny">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preferred Time */}
                <div className="form-group">
                    <label className="form-label">Best Time for Challenges</label>
                    <div className="flex gap-xs flex-wrap">
                        {[
                            { value: 'morning', label: 'Morning', emoji: '🌅' },
                            { value: 'afternoon', label: 'Afternoon', emoji: '☀️' },
                            { value: 'evening', label: 'Evening', emoji: '🌙' },
                            { value: 'anytime', label: 'Anytime', emoji: '🔄' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updatePref('preferredChallengeTime', opt.value)}
                                className={`btn ${prefs.preferredChallengeTime === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                            >
                                {opt.emoji} {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reality Shift Mode */}
                <div className="form-group">
                    <label className="flex items-center gap-md" style={{ cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={prefs.realityShiftEnabled}
                            onChange={e => updatePref('realityShiftEnabled', e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <div>
                            <div className="heading-5">⚡ Reality Shift Mode</div>
                            <div className="text-small text-muted">
                                Enable extreme, life-changing challenges that push you far outside your comfort zone
                            </div>
                        </div>
                    </label>
                </div>
            </section>

            {/* Focus Areas Section */}
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">🎪 Focus Areas</h2>
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
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* AI Personality Section */}
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">🤖 AI Personality</h2>

                <div className="form-group">
                    <label className="form-label">How should the AI coach you?</label>
                    <div className="flex flex-col gap-sm">
                        {[
                            { value: 'encouraging', label: 'Encouraging', desc: 'Supportive, celebrates wins, gentle pushes', emoji: '🌟' },
                            { value: 'tough-love', label: 'Tough Love', desc: 'Direct, no excuses, pushes hard', emoji: '💪' },
                            { value: 'scientific', label: 'Scientific', desc: 'Data-driven, research-based, analytical', emoji: '🔬' },
                            { value: 'casual', label: 'Casual Friend', desc: 'Relaxed, conversational, humorous', emoji: '😊' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updatePref('aiPersonality', opt.value)}
                                className={`card ${prefs.aiPersonality === opt.value ? 'card-highlight' : 'card-surface'}`}
                                style={{
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    border: prefs.aiPersonality === opt.value ? '2px solid var(--color-primary)' : '2px solid transparent'
                                }}
                            >
                                <div className="flex items-center gap-md">
                                    <span style={{ fontSize: '1.5rem' }}>{opt.emoji}</span>
                                    <div>
                                        <div className="heading-5">{opt.label}</div>
                                        <div className="text-small text-muted">{opt.desc}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group mt-md">
                    <label className="flex items-center gap-md" style={{ cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={prefs.includeScientificBasis}
                            onChange={e => updatePref('includeScientificBasis', e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <div>
                            <div className="heading-5">📚 Include Scientific Basis</div>
                            <div className="text-small text-muted">
                                Show why each challenge works based on research
                            </div>
                        </div>
                    </label>
                </div>
            </section>

            {/* AI Voice Section */}
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">AI Voice</h2>
                <p className="text-small text-muted mb-md">
                    Select a voice for AI speech. Click to hear a sample.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.5rem',
                }}>
                    {OPENAI_VOICES.map(voice => (
                        <button
                            key={voice.id}
                            onClick={() => {
                                updatePref('voiceId', voice.id);
                                playVoiceSample(voice.id);
                            }}
                            className={`card ${prefs.voiceId === voice.id ? 'card-highlight' : 'card-surface'}`}
                            style={{
                                textAlign: 'center',
                                cursor: 'pointer',
                                padding: '0.75rem 0.5rem',
                                border: prefs.voiceId === voice.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                opacity: playingVoice === voice.id ? 0.7 : 1,
                            }}
                        >
                            <div className="heading-5" style={{ fontSize: '0.9rem' }}>
                                {playingVoice === voice.id ? '...' : ''} {voice.label}
                            </div>
                            <div className="text-tiny text-muted">{voice.desc}</div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Save Button */}
            <div className="mb-xl">
                <button
                    onClick={saveSettings}
                    className="btn btn-success w-full"
                    disabled={saving}
                    style={{ padding: '1rem', fontSize: '1.125rem' }}
                >
                    {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Settings'}
                </button>
            </div>
        </div>
    );
}
