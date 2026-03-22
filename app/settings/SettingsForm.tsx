'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import ProfileSettings from './components/ProfileSettings';
import ChallengeSettings from './components/ChallengeSettings';
import AISettings from './components/AISettings';
import NotificationSettings from './components/NotificationSettings';

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
            <ProfileSettings
                prefs={prefs}
                updatePref={updatePref}
                accentColors={ACCENT_COLORS}
            />

            <ChallengeSettings
                prefs={prefs}
                updatePref={updatePref}
                focusInput={focusInput}
                setFocusInput={setFocusInput}
                addFocusArea={addFocusArea}
                removeFocusArea={removeFocusArea}
            />

            <AISettings
                prefs={prefs}
                updatePref={updatePref}
                voiceOptions={VOICE_OPTIONS}
                voiceSaved={voiceSaved}
            />

            <NotificationSettings
                prefs={prefs}
                updatePref={updatePref}
                pushSupported={pushSupported}
                pushPermission={pushPermission}
                pushSubscribe={push.subscribe}
                pushUnsubscribe={push.unsubscribe}
            />

            {/* Save Button */}
            <div className="mb-xl">
                <button
                    onClick={saveSettings}
                    className="btn btn-success w-full"
                    disabled={saving}
                    style={{ padding: '1rem', fontSize: '1.125rem' }}
                >
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
