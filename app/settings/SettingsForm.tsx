'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

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
    accentColor?: string;
    // AI Voice Selection
    voiceId?: string;
    // AI Personality Customization
    aiCustomName?: string;
    tonePreference?: string;
    rudeMode?: boolean;
}

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
    accentColor: 'teal',
    // AI Voice Selection
    voiceId: 'nova',
    // AI Personality Customization
    aiCustomName: '',
    tonePreference: 'friendly',
    rudeMode: false
};

const ACCENT_COLORS = [
    { id: 'teal', name: 'Teal', primary: '#0d9488', secondary: '#06b6d4', emoji: '🌊' },
    { id: 'gold', name: 'Gold', primary: '#d97706', secondary: '#f59e0b', emoji: '✨' },
    { id: 'blue', name: 'Blue', primary: '#3b82f6', secondary: '#60a5fa', emoji: '💙' },
    { id: 'purple', name: 'Purple', primary: '#8b5cf6', secondary: '#a78bfa', emoji: '💜' },
    { id: 'rose', name: 'Rose', primary: '#e11d48', secondary: '#f43f5e', emoji: '🌹' },
];

const VOICE_OPTIONS = [
    { id: 'alloy', name: 'Alloy', gender: 'neutral', description: 'Balanced and versatile' },
    { id: 'ash', name: 'Ash', gender: 'male', description: 'Warm and conversational' },
    { id: 'coral', name: 'Coral', gender: 'female', description: 'Warm and engaging' },
    { id: 'echo', name: 'Echo', gender: 'male', description: 'Clear and professional' },
    { id: 'fable', name: 'Fable', gender: 'neutral', description: 'Expressive and dynamic' },
    { id: 'onyx', name: 'Onyx', gender: 'male', description: 'Deep and authoritative' },
    { id: 'nova', name: 'Nova', gender: 'female', description: 'Friendly and approachable' },
    { id: 'sage', name: 'Sage', gender: 'female', description: 'Calm and wise' },
    { id: 'shimmer', name: 'Shimmer', gender: 'female', description: 'Bright and energetic' },
];



export default function SettingsForm({ initialPreferences }: { initialPreferences: Preferences | null }) {
    const [prefs, setPrefs] = useState<Preferences>({ ...DEFAULT_PREFS, ...initialPreferences });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [focusInput, setFocusInput] = useState('');
    const [voiceSaved, setVoiceSaved] = useState(false);
    const { setAccentColor } = useTheme();
    const initialLoadRef = useRef(true);
    const voiceSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const push = usePushNotifications();
    const { isSupported: pushSupported, permission: pushPermission } = push;

    const updatePref = (key: string, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
        setSaved(false);

        // Immediate update for visual feedback
        if (key === 'accentColor') {
            setAccentColor(value);
        }
    };

    // Auto-save when voiceId changes (skip initial load)
    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }

        if (voiceSaveTimeoutRef.current) {
            clearTimeout(voiceSaveTimeoutRef.current);
        }

        voiceSaveTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prefs)
                });
                if (response.ok) {
                    setVoiceSaved(true);
                    setTimeout(() => setVoiceSaved(false), 2000);
                }
            } catch (error) {
                console.error('Error auto-saving voice selection:', error);
            }
        }, 500);

        return () => {
            if (voiceSaveTimeoutRef.current) {
                clearTimeout(voiceSaveTimeoutRef.current);
            }
        };
    }, [prefs.voiceId]); // eslint-disable-line react-hooks/exhaustive-deps

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

                <div className="form-group mb-md">
                    <label className="form-label">Display Name</label>
                    <input
                        type="text"
                        value={prefs.displayName || ''}
                        onChange={e => updatePref('displayName', e.target.value)}
                        placeholder="Your name"
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Accent Color</label>
                    <div className="flex gap-sm flex-wrap">
                        {ACCENT_COLORS.map(color => (
                            <button
                                key={color.id}
                                onClick={() => updatePref('accentColor', color.id)}
                                className={`btn`}
                                style={{
                                    flex: 1,
                                    minWidth: '80px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '12px',
                                    border: prefs.accentColor === color.id ? `2px solid ${color.primary}` : '1px solid var(--color-border)',
                                    background: prefs.accentColor === color.id ? 'var(--color-surface-2)' : 'var(--color-surface)',
                                }}
                            >
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`
                                }} />
                                <span className="text-small">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Challenge Generation Section */}
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">🎯 Challenge Generation</h2>

                {/* Preferred Difficulty */}
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

                {/* Challenges Per Day */}
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

                {/* Preferred Time */}
                <div className="form-group">
                    <label className="form-label">Best Time for Challenges</label>
                    <div className="flex gap-sm flex-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
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

                {/* Reality Shift Mode */}
                <div className="form-group">
                    <label className="flex items-center gap-md" style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <div className="heading-5">⚡ Reality Shift Mode</div>
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
                    <label className="flex items-center gap-md" style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <div className="heading-5">📚 Include Scientific Basis</div>
                            <div className="text-small text-muted">
                                Show why each challenge works based on research
                            </div>
                        </div>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={prefs.includeScientificBasis}
                                onChange={e => updatePref('includeScientificBasis', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </div>
                    </label>
                </div>
            </section>

            {/* AI Voice Selection Section */}
            <section className="card mb-lg">
                <div className="flex items-center gap-sm mb-md" style={{ justifyContent: 'space-between' }}>
                    <h2 className="heading-4" style={{ margin: 0 }}>🎙️ AI Voice</h2>
                    {voiceSaved && (
                        <span className="text-small" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                            Saved
                        </span>
                    )}
                </div>
                <p className="text-small text-muted mb-md">
                    Choose the voice for audio responses
                </p>

                <div className="form-group">
                    <div
                        className="voice-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 'var(--spacing-sm)'
                        }}
                    >
                        {VOICE_OPTIONS.map(voice => (
                            <button
                                key={voice.id}
                                onClick={() => updatePref('voiceId', voice.id)}
                                className="btn"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '12px 8px',
                                    border: prefs.voiceId === voice.id
                                        ? '3px solid var(--color-primary)'
                                        : '1px solid var(--color-border)',
                                    background: prefs.voiceId === voice.id
                                        ? 'var(--color-surface-2)'
                                        : 'var(--color-surface)',
                                    minHeight: '90px',
                                    justifyContent: 'center',
                                    fontWeight: prefs.voiceId === voice.id ? 'bold' : 'normal',
                                    transform: prefs.voiceId === voice.id ? 'scale(1.02)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>
                                    {voice.gender === 'female' ? '👩' : voice.gender === 'male' ? '👨' : '🧑'}
                                </span>
                                <span className="text-small">
                                    {voice.name}
                                </span>
                                <span
                                    className="text-tiny text-muted"
                                    style={{
                                        textAlign: 'center',
                                        lineHeight: 1.2,
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {voice.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>



            {/* Notifications Section */}
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">🔔 Notifications</h2>

                <div className="form-group">
                    <label className="flex items-center gap-md" style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <div className="heading-5">Daily Reminders</div>
                            <div className="text-small text-muted">
                                {!pushSupported
                                    ? 'Push notifications are not supported in this browser'
                                    : pushPermission === 'denied'
                                        ? 'Notifications blocked -- reset in browser settings'
                                        : 'Get reminded about your challenges'}
                            </div>
                        </div>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={prefs.notificationsEnabled}
                                disabled={!pushSupported || pushPermission === 'denied'}
                                onChange={async (e) => {
                                    const enabled = e.target.checked;
                                    updatePref('notificationsEnabled', enabled);
                                    if (enabled) {
                                        await push.subscribe();
                                    } else {
                                        await push.unsubscribe();
                                    }
                                }}
                            />
                            <span className="toggle-slider"></span>
                        </div>
                    </label>
                </div>

                {prefs.notificationsEnabled && (
                    <div className="form-group">
                        <label className="form-label">Reminder Time</label>
                        <input
                            type="time"
                            value={prefs.dailyReminderTime}
                            onChange={e => updatePref('dailyReminderTime', e.target.value)}
                            className="form-input"
                            style={{ maxWidth: '150px' }}
                        />
                    </div>
                )}

                <div className="form-group">
                    <label className="flex items-center gap-md" style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <div className="heading-5">Streak Protection</div>
                            <div className="text-small text-muted">Warn me before I lose my streak</div>
                        </div>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={prefs.streakReminders}
                                onChange={e => updatePref('streakReminders', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </div>
                    </label>
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
