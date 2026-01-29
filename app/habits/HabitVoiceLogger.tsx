'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Check, RotateCcw, Loader2, Pause, Play } from 'lucide-react';

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

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'confirming';

export default function HabitVoiceLogger({ onClose, onLogged }: HabitVoiceLoggerProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [transcript, setTranscript] = useState('');
    const [interpretedLogs, setInterpretedLogs] = useState<InterpretedLog[]>([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [editedNotes, setEditedNotes] = useState<{ [key: string]: string }>({});
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        setError('');
        setTranscript('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop tracks
                stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // Transcribe via server
                setState('processing');
                try {
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'recording.webm');

                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    const text = data.text || data.data?.text || '';

                    if (text.trim()) {
                        setTranscript(text);
                        // Now interpret the transcript
                        await interpretTranscript(text);
                    } else {
                        setError('No speech detected. Please try again.');
                        setState('idle');
                    }
                } catch (err) {
                    console.error('Transcription failed:', err);
                    setError('Transcription failed. Please try again.');
                    setState('idle');
                }
            };

            mediaRecorder.start();
            setState('recording');
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } catch (err) {
            console.error('Microphone access denied:', err);
            setError('Could not access microphone');
            setState('idle');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.pause();
            setState('paused');
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && state === 'paused') {
            mediaRecorderRef.current.resume();
            setState('recording');
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
            mediaRecorderRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const interpretTranscript = async (text: string) => {
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
                // Initialize edited notes
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
        setState('idle');
        setTranscript('');
        setInterpretedLogs([]);
        setError('');
        setDuration(0);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    return (
        <div className="voice-overlay" onClick={onClose}>
            <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="voice-content">
                    {/* IDLE State */}
                    {state === 'idle' && (
                        <>
                            <div className="voice-icon idle">
                                <Mic size={48} />
                            </div>
                            <h2>Voice Habit Log</h2>
                            <p>Tell me which habits you completed today</p>
                            <p className="hint">e.g., "I did my meditation and workout, but skipped journaling"</p>

                            {error && <div className="error">{error}</div>}

                            <button className="record-btn" onClick={startRecording}>
                                <Mic size={24} />
                                Start Recording
                            </button>
                        </>
                    )}

                    {/* RECORDING / PAUSED State */}
                    {(state === 'recording' || state === 'paused') && (
                        <>
                            <div className={`voice-icon ${state === 'recording' ? 'recording' : 'paused'}`}>
                                {state === 'recording' ? <Mic size={48} /> : <Pause size={48} />}
                                {state === 'recording' && (
                                    <>
                                        <div className="pulse-ring"></div>
                                        <div className="pulse-ring delay"></div>
                                    </>
                                )}
                            </div>

                            {/* Timer Display */}
                            <div className="timer-display">
                                {formatDuration(duration)}
                            </div>

                            <h2>{state === 'recording' ? 'Listening...' : 'Paused'}</h2>

                            <div className="transcript-preview" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)'
                            }}>
                                <span className="breathing-text">
                                    {state === 'recording' ? 'Listening... Tap pause or stop when done' : 'Recording paused. Tap resume to continue.'}
                                </span>
                            </div>

                            <div className="recording-controls">
                                {state === 'recording' ? (
                                    <button className="pause-btn" onClick={pauseRecording}>
                                        <Pause size={24} />
                                        Pause
                                    </button>
                                ) : (
                                    <button className="resume-btn" onClick={resumeRecording}>
                                        <Play size={24} />
                                        Resume
                                    </button>
                                )}
                                <button className="stop-btn" onClick={stopRecording}>
                                    <MicOff size={24} />
                                    Stop
                                </button>
                            </div>
                        </>
                    )}

                    {/* PROCESSING State */}
                    {state === 'processing' && (
                        <>
                            <div className="voice-icon processing">
                                <Loader2 size={48} className="spin" />
                            </div>
                            <h2>Processing...</h2>
                            <p>AI is interpreting your habits</p>
                        </>
                    )}

                    {/* CONFIRMING State */}
                    {state === 'confirming' && (
                        <>
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
                                                    {log.completed ? '✅' : '❌'}
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
                        </>
                    )}
                </div>

                <style jsx>{`
                    .voice-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.8);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                        backdrop-filter: blur(8px);
                    }

                    .voice-modal {
                        background: var(--color-surface);
                        border-radius: 24px;
                        width: 100%;
                        max-width: 400px;
                        max-height: 85vh;
                        overflow-y: auto;
                        position: relative;
                        animation: modalIn 0.3s ease-out;
                    }

                    @keyframes modalIn {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }

                    .close-btn {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: var(--color-surface-2);
                        border: none;
                        border-radius: 12px;
                        padding: 8px;
                        color: var(--color-text-muted);
                        cursor: pointer;
                        z-index: 10;
                    }

                    .voice-content {
                        padding: 40px 24px 24px;
                        text-align: center;
                    }

                    .voice-icon {
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
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
                        background: var(--color-primary);
                        color: white;
                    }

                    .pulse-ring {
                        position: absolute;
                        inset: -10px;
                        border-radius: 50%;
                        border: 3px solid var(--color-error);
                        animation: pulse 1.5s infinite;
                    }

                    .pulse-ring.delay {
                        animation-delay: 0.5s;
                    }

                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 0.8; }
                        100% { transform: scale(1.4); opacity: 0; }
                    }

                    .spin {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    .timer-display {
                        font-size: 2rem;
                        font-weight: 700;
                        font-family: monospace;
                        color: var(--color-text);
                        margin-bottom: 8px;
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
                        margin-bottom: 24px;
                    }

                    .confirm-hint {
                        font-size: 0.85rem;
                        margin-bottom: 16px;
                    }

                    .transcript-preview {
                        background: var(--color-background);
                        padding: 16px;
                        border-radius: 12px;
                        margin: 16px 0 24px;
                        min-height: 80px;
                        color: var(--color-text);
                        font-size: 0.95rem;
                        text-align: left;
                        max-height: 150px;
                        overflow-y: auto;
                    }

                    .record-btn, .stop-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        padding: 14px 28px;
                        border-radius: 14px;
                        font-size: 1rem;
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

                    .voice-icon.paused {
                        background: var(--color-warning, #fbbf24);
                        color: white;
                    }

                    .recording-controls {
                        display: flex;
                        gap: 12px;
                        justify-content: center;
                    }

                    .pause-btn, .resume-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        padding: 14px 28px;
                        border-radius: 14px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s;
                    }

                    .pause-btn {
                        background: var(--color-warning, #fbbf24);
                        color: white;
                    }

                    .pause-btn:hover {
                        opacity: 0.9;
                    }

                    .resume-btn {
                        background: var(--color-success);
                        color: white;
                    }

                    .resume-btn:hover {
                        opacity: 0.9;
                    }

                    .logs-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin: 20px 0;
                        text-align: left;
                    }

                    .log-item {
                        background: var(--color-background);
                        border-radius: 12px;
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
                        padding: 12px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        text-align: left;
                    }

                    .log-status {
                        font-size: 1.25rem;
                    }

                    .log-name {
                        font-weight: 600;
                        color: var(--color-text);
                    }

                    .log-note {
                        width: 100%;
                        padding: 10px 12px;
                        border: none;
                        border-top: 1px solid var(--color-border);
                        background: var(--color-surface);
                        color: var(--color-text);
                        font-size: 0.9rem;
                    }

                    .log-note:focus {
                        outline: none;
                        background: var(--color-surface-2);
                    }

                    .no-habits {
                        padding: 24px;
                        color: var(--color-text-muted);
                    }

                    .error {
                        background: rgba(239, 68, 68, 0.1);
                        border: 1px solid var(--color-error);
                        color: var(--color-error);
                        padding: 12px;
                        border-radius: 10px;
                        margin: 16px 0;
                        font-size: 0.9rem;
                    }

                    .confirm-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 20px;
                    }

                    .retry-btn, .confirm-btn {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        padding: 14px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s;
                    }

                    .retry-btn {
                        background: var(--color-surface-2);
                        color: var(--color-text);
                    }

                    .confirm-btn {
                        background: var(--color-success);
                        color: white;
                    }

                    .confirm-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </div>
    );
}
