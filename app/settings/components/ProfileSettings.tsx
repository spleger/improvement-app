'use client';

interface AccentColor {
    id: string;
    name: string;
    primary: string;
    secondary: string;
    emoji: string;
}

interface ProfileSettingsProps {
    prefs: {
        displayName?: string;
        accentColor?: string;
    };
    updatePref: (key: string, value: any) => void;
    accentColors: AccentColor[];
}

export default function ProfileSettings({ prefs, updatePref, accentColors }: ProfileSettingsProps) {
    return (
        <section className="card mb-lg">
            <h2 className="heading-4 mb-md">{'\u{1F464}'} Profile</h2>

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
                    {accentColors.map(color => (
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
    );
}
