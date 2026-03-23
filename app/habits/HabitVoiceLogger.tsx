'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Check, RotateCcw, Loader2, ArrowLeft } from 'lucide-react';

interface InterpretedLog {
    habitId: string;
    habitName: string;
    completed: boolean;
    notes?: string;
}

interface HabitVoiceLoggerProps {
    onClose: () => void;
    onLogged: () => void;
}

// Extend Window interface for Speech Recognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'confirming';

export default function HabitVoiceLogger({ onClose, onLogged }: HabitVoiceLoggerProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [transcript, setTranscript] = useState('');
    const [interpretedLogs, setInterpretedLogs] = useState<InterpretedLog[]>([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [editedNotes, setEditedNotes] = useState<{ [key: string]: string }>({});

    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef('');
    const recordingRef = useRef(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let finalText = '';
                let interimText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const text = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += text + ' ';
                    } else {
                        interimText += text;
                    }
                }

                if (finalText) {
                    transcriptRef.current = transcriptRef.current + finalText;
                }
                // Display final + interim so user sees live feedback
                setTranscript(transcriptRef.current + interimText);
            };

            recognition.onend = () => {
                // Auto-restart if still recording (recognition stops after silence)
                if (recordingRef.current) {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) {
                        // Already started or component unmounted
                    }
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'aborted' && event.error !== 'no-speech') {
                    setError('Speech recognition error. Please try again.');
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            recordingRef.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const processTranscript = useCallback(async (text: string) => {
        if (!text.trim()) {
            setError('No speech detected. Please try again.');
            setState('idle');
            return;
        }

        setState('processing');

        try {
            const res = await fetch('/api/habits/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: text.trim() })
            });

            const data = await res.json();

            if (data.success && data.data.interpretedLogs) {
                setInterpretedLogs(data.data.interpretedLogs);
                const notes: { [key: string]: string } = {};
                data.data.interpretedLogs.forEach((log: InterpretedLog) => {
                    notes[log.habitId] = log.notes || '';
                });
                setEditedNotes(notes);
                setState('confirming');
            } else {
                setError(data.data?.message || 'Failed to interpret speech');
                setState('idle');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setState('idle');
        }
    }, []);

    const startRecording = () => {
        setError('');
        setTranscript('');
        transcriptRef.current = '';
        recordingRef.current = true;
        setState('recording');

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.log('Recognition start error:', e);
            }
        } else {
            setError('Speech recognition not supported in this browser');
        }
    };

    const stopRecording = () => {
        recordingRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Already stopped
            }
        }
        // Process directly using ref (avoids stale closure)
        processTranscript(transcriptRef.current);
    };

    const toggleHabitCompletion = (habitId: string) => {
        setInterpretedLogs(prev => prev.map(log =>
            log.habitId === habitId
                ? { ...log, completed: !log.completed }
                : log
        ));
    };

    const confirmLogs = async () => {
        if (interpretedLogs.length === 0) {
            onLogged();
            return;
        }

        setSaving(true);

        try {
            const logsToSubmit = interpretedLogs.map(log => ({
                habitId: log.habitId,
                completed: log.completed,
                notes: editedNotes[log.habitId] || log.notes || null,
                source: 'voice_ai'
            }));

            const res = await fetch('/api/habits/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs: logsToSubmit })
            });

            if (res.ok) {
                onLogged();
            } else {
                setError('Failed to save logs');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        recordingRef.current = false;
        setState('idle');
        setTranscript('');
        transcriptRef.current = '';
        setInterpretedLogs([]);
        setError('');
    };

    return (
        <div className="voice-page">
            {/* Header */}
            <div className="voice-header">
                <button className="voice-back-btn" onClick={onClose}>
                    <ArrowLeft size={20} />
                </button>
                <h1>Voice Habit Log</h1>
                <div style={{ width: 40 }} />
            </div>

            {/* Content */}
            <div className="voice-body">
                {/* IDLE State */}
                {state === 'idle' && (
                    <div className="voice-center">
                        <div className="voice-icon idle">
                            <Mic size={56} />
                        </div>
                        <h2>Log your habits by voice</h2>
                        <p>Tell me which habits you completed today</p>
                        <p className="hint">e.g., "I did my meditation and workout, but skipped journaling"</p>

                        {error && <div className="error">{error}</div>}

                        <button className="record-btn" onClick={startRecording}>
                            <Mic size={24} />
                            Start Recording
                        </button>
                    </div>
                )}

                {/* RECORDING State */}
                {state === 'recording' && (
                    <div className="voice-center">
                        <div className="voice-icon recording">
                            <Mic size={56} />
                            <div className="pulse-ring" />
                            <div className="pulse-ring delay" />
                        </div>
                        <h2>Listening...</h2>

                        <div className="transcript-preview">
                            {transcript || 'Start speaking...'}
                        </div>

                        <button className="stop-btn" onClick={stopRecording}>
                            <MicOff size={24} />
                            Done Recording
                        </button>
                    </div>
                )}

                {/* PROCESSING State */}
                {state === 'processing' && (
                    <div className="voice-center">
                        <div className="voice-icon processing">
                            <Loader2 size={56} className="spin" />
                        </div>
                        <h2>Processing...</h2>
                        <p>AI is interpreting your habits</p>
                    </div>
                )}

                {/* CONFIRMING State */}
                {state === 'confirming' && (
                    <div className="voice-confirm">
                        <h2>Confirm Your Habits</h2>
                        <p className="confirm-hint">Tap to toggle, edit notes if needed</p>

                        {interpretedLogs.length === 0 ? (
                            <div className="no-habits">
                                <p>No habits were detected in your speech.</p>
                                <button className="retry-btn" onClick={reset}>
                                    <RotateCcw size={18} />
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="logs-list">
                                {interpretedLogs.map(log => (
                                    <div
                                        key={log.habitId}
                                        className={`log-item ${log.completed ? 'completed' : 'missed'}`}
                                    >
                                        <button
                                            className="log-toggle"
                                            onClick={() => toggleHabitCompletion(log.habitId)}
                                        >
                                            <span className="log-status">
                                                {log.completed ? 'Done' : 'Missed'}
                                            </span>
                                            <span className="log-name">{log.habitName}</span>
                                        </button>
                                        <input
                                            type="text"
                                            className="log-note"
                                            placeholder="Add note..."
                                            value={editedNotes[log.habitId] || ''}
                                            onChange={(e) => setEditedNotes(prev => ({
                                                ...prev,
                                                [log.habitId]: e.target.value
                                            }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && <div className="error">{error}</div>}

                        <div className="confirm-actions">
                            <button className="retry-btn" onClick={reset}>
                                <RotateCcw size={18} />
                                Retry
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={confirmLogs}
                                disabled={saving}
                            >
                                <Check size={18} />
                                {saving ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .voice-page {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    background: var(--color-background);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .voice-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border);
                    background: rgba(var(--color-surface-rgb), 0.85);
                    backdrop-filter: blur(12px);
                    flex-shrink: 0;
                }

                .voice-header h1 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--color-text);
                }

                .voice-back-btn {
                    width: 40px;
                    height: 40px;
                    background: transparent;
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                    color: var(--color-text);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                }

                .voice-body {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }

                .voice-center {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 24px;
                    text-align: center;
                }

                .voice-confirm {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                }

                .voice-confirm h2 {
                    text-align: center;
                }

                .voice-confirm .confirm-hint {
                    text-align: center;
                }

                .voice-icon {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 32px;
                    position: relative;
                }

                .voice-icon.idle {
                    background: var(--color-surface-2);
                    color: var(--color-text-muted);
                }

                .voice-icon.recording {
                    background: var(--color-error);
                    color: white;
                }

                .voice-icon.processing {
                    background: var(--gradient-primary);
                    color: white;
                }

                .pulse-ring {
                    position: absolute;
                    inset: -12px;
                    border-radius: 50%;
                    border: 3px solid var(--color-error);
                    animation: pulse 1.5s infinite;
                }

                .pulse-ring.delay {
                    animation-delay: 0.5s;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.5); opacity: 0; }
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin-bottom: 8px;
                }

                p {
                    color: var(--color-text-muted);
                    margin-bottom: 8px;
                }

                .hint {
                    font-size: 0.85rem;
                    font-style: italic;
                    margin-bottom: 32px;
                    max-width: 320px;
                }

                .confirm-hint {
                    font-size: 0.85rem;
                    margin-bottom: 16px;
                }

                .transcript-preview {
                    background: var(--color-surface);
                    padding: 20px;
                    border-radius: 16px;
                    margin: 20px 0 32px;
                    width: 100%;
                    max-width: 400px;
                    min-height: 100px;
                    max-height: 200px;
                    overflow-y: auto;
                    color: var(--color-text);
                    font-size: 1rem;
                    text-align: left;
                    line-height: 1.5;
                }

                .record-btn, .stop-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 16px 32px;
                    border-radius: 16px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .record-btn {
                    background: var(--gradient-primary);
                    color: white;
                }

                .record-btn:hover {
                    transform: scale(1.05);
                }

                .stop-btn {
                    background: var(--color-error);
                    color: white;
                }

                .stop-btn:hover {
                    opacity: 0.9;
                }

                .logs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin: 20px 0;
                }

                .log-item {
                    background: var(--color-surface);
                    border-radius: 14px;
                    overflow: hidden;
                    border: 2px solid var(--color-border);
                }

                .log-item.completed {
                    border-color: var(--color-success);
                }

                .log-item.missed {
                    border-color: var(--color-error);
                }

                .log-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 14px 16px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                }

                .log-status {
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 4px 10px;
                    border-radius: 8px;
                    flex-shrink: 0;
                }

                .log-item.completed .log-status {
                    background: rgba(16, 185, 129, 0.15);
                    color: var(--color-success);
                }

                .log-item.missed .log-status {
                    background: rgba(239, 68, 68, 0.15);
                    color: var(--color-error);
                }

                .log-name {
                    font-weight: 600;
                    color: var(--color-text);
                    font-size: 1rem;
                }

                .log-note {
                    width: 100%;
                    padding: 12px 16px;
                    border: none;
                    border-top: 1px solid var(--color-border);
                    background: var(--color-surface-2);
                    color: var(--color-text);
                    font-size: 0.9rem;
                    font-family: inherit;
                }

                .log-note:focus {
                    outline: none;
                    background: var(--color-background);
                }

                .no-habits {
                    padding: 40px 24px;
                    text-align: center;
                    color: var(--color-text-muted);
                }

                .error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid var(--color-error);
                    color: var(--color-error);
                    padding: 12px 16px;
                    border-radius: 12px;
                    margin: 16px 0;
                    font-size: 0.9rem;
                }

                .confirm-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 24px;
                    padding-bottom: 24px;
                }

                .retry-btn, .confirm-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 16px;
                    border-radius: 14px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .retry-btn {
                    background: var(--color-surface-2);
                    color: var(--color-text);
                }

                .confirm-btn {
                    background: var(--gradient-success);
                    color: white;
                }

                .confirm-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
