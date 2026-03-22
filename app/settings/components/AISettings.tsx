'use client';

interface VoiceOption {
    id: string;
    name: string;
    gender: string;
    description: string;
}

interface AISettingsProps {
    prefs: {
        aiPersonality?: string;
        includeScientificBasis?: boolean;
        voiceId?: string;
    };
    updatePref: (key: string, value: any) => void;
    voiceSaved: boolean;
    voiceOptions: VoiceOption[];
}

const PERSONALITY_OPTIONS = [
    { value: 'encouraging', label: 'Encouraging', desc: 'Supportive, celebrates wins, gentle pushes', emoji: '\u{1F31F}' },
    { value: 'tough-love', label: 'Tough Love', desc: 'Direct, no excuses, pushes hard', emoji: '\u{1F4AA}' },
    { value: 'scientific', label: 'Scientific', desc: 'Data-driven, research-based, analytical', emoji: '\u{1F52C}' },
    { value: 'casual', label: 'Casual Friend', desc: 'Relaxed, conversational, humorous', emoji: '\u{1F60A}' }
];

export default function AISettings({ prefs, updatePref, voiceSaved, voiceOptions }: AISettingsProps) {
    return (
        <>
            <section className="card mb-lg">
                <h2 className="heading-4 mb-md">{'\u{1F916}'} AI Personality</h2>

                <div className="form-group">
                    <label className="form-label">How should the AI coach you?</label>
                    <div className="flex flex-col gap-sm">
                        {PERSONALITY_OPTIONS.map(opt => (
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
                            <div className="heading-5">{'\u{1F4DA}'} Include Scientific Basis</div>
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

            <section className="card mb-lg">
                <div className="flex items-center gap-sm mb-md" style={{ justifyContent: 'space-between' }}>
                    <h2 className="heading-4" style={{ margin: 0 }}>{'\u{1F399}\uFE0F'} AI Voice</h2>
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
                        {voiceOptions.map(voice => (
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
                                    {voice.gender === 'female' ? '\u{1F469}' : voice.gender === 'male' ? '\u{1F468}' : '\u{1F9D1}'}
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
        </>
    );
}
