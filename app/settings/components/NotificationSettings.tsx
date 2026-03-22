'use client';

interface NotificationSettingsProps {
    prefs: {
        notificationsEnabled?: boolean;
        dailyReminderTime?: string;
        streakReminders?: boolean;
    };
    updatePref: (key: string, value: any) => void;
    pushSupported: boolean;
    pushPermission: string;
    pushSubscribe: () => Promise<boolean>;
    pushUnsubscribe: () => Promise<boolean>;
}

export default function NotificationSettings({ prefs, updatePref, pushSupported, pushPermission, pushSubscribe, pushUnsubscribe }: NotificationSettingsProps) {
    return (
        <section className="card mb-lg">
            <h2 className="heading-4 mb-md">{'\u{1F514}'} Notifications</h2>

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
                                    await pushSubscribe();
                                } else {
                                    await pushUnsubscribe();
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
    );
}
