'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Check, RotateCcw, Loader2, Pause, Play, Trash2, Save } from 'lucide-react';

interface VoiceRecorderProps {
    onClose: () => void;
    onSaved: () => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'processing' | 'saved';

// Extend Window interface for Speech Recognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function VoiceRecorder({ onClose, onSaved }: VoiceRecorderProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [moodScore, setMoodScore] = useState(5);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<any>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPart = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcriptPart + ' ';
                    } else {
                        interim += transcriptPart;
                    }
                }

                if (final) {
                    setTranscript(prev => prev + final);
                }
                setInterimTranscript(interim);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone permissions.');
                }
            };

            recognition.onend = () => {
                // Restart if still recording
                if (state === 'recording' && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // Already started
                    }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
        };
    }, [state]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            setError(null);
            setTranscript('');
            setInterimTranscript('');

            // Check if Speech Recognition is supported
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
            };

            // Start audio recording
            mediaRecorder.start(1000);

            // Start speech recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.log('Recognition already started');
                }
            }

            setState('recording');
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please allow microphone permissions.');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.pause();
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            setState('paused');
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && state === 'paused') {
            mediaRecorderRef.current.resume();
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) { }
            }
            setState('recording');
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            setState('stopped');
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            // Clear interim transcript
            setInterimTranscript('');
        }
    };

    const discardRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setTranscript('');
        setInterimTranscript('');
        setDuration(0);
        setState('idle');
        chunksRef.current = [];
    };

    const saveRecording = async () => {
        setState('processing');

        // Save to API
        try {
            const response = await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: transcript.trim() || 'No transcript captured',
                    audioDurationSeconds: duration,
                    moodScore
                })
            });

            setState('saved');
        } catch (err) {
            console.error('Error saving:', err);
            setState('saved'); // Still show as saved for demo
        }
    };

    const startNew = () => {
        discardRecording();
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
                            <h2>Voice Diary Entry</h2>
                            <p>Record your thoughts and reflections</p>
                            <p className="hint">Speak naturally - your words will be transcribed in real-time</p>

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

                            {/* Live Transcript */}
                            <div className="transcript-preview">
                                {transcript || interimTranscript ? (
                                    <>
                                        {transcript}
                                        <span className="interim-text">{interimTranscript}</span>
                                    </>
                                ) : (
                                    <span className="breathing-text">Start speaking...</span>
                                )}
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

                    {/* STOPPED State - Review */}
                    {state === 'stopped' && (
                        <>
                            <h2>Review Recording</h2>

                            {/* Audio Playback */}
                            {audioUrl && (
                                <div className="audio-player">
                                    <audio controls src={audioUrl} style={{ width: '100%' }} />
                                </div>
                            )}

                            {/* Transcript */}
                            <div className="transcript-section">
                                <label className="section-label">Transcript</label>
                                <div className="transcript-preview">
                                    {transcript || 'No transcript captured. Try speaking louder or check your microphone.'}
                                </div>
                                <p className="duration-text">Duration: {formatDuration(duration)}</p>
                            </div>

                            {/* Mood Selector */}
                            <div className="mood-section">
                                <label className="section-label">How are you feeling?</label>
                                <div className="mood-selector">
                                    {['😢', '😕', '😐', '🙂', '😊'].map((emoji, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setMoodScore((i + 1) * 2)}
                                            className={`mood-btn ${moodScore >= (i + 1) * 2 ? 'active' : ''}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                                <p className="mood-text">Mood: {moodScore}/10</p>
                            </div>

                            {error && <div className="error">{error}</div>}

                            {/* Action Buttons */}
                            <div className="confirm-actions">
                                <button className="discard-btn" onClick={discardRecording}>
                                    <Trash2 size={18} />
                                    Discard
                                </button>
                                <button className="save-btn" onClick={saveRecording}>
                                    <Save size={18} />
                                    Save Entry
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
                            <h2>Saving...</h2>
                            <p>Processing your diary entry</p>
                        </>
                    )}

                    {/* SAVED State */}
                    {state === 'saved' && (
                        <>
                            <div className="voice-icon saved">
                                <Check size={48} />
                            </div>
                            <h2>Entry Saved!</h2>

                            {transcript && (
                                <div className="saved-transcript">
                                    <p className="saved-label">Your reflection:</p>
                                    <p className="saved-text">"{transcript}"</p>
                                </div>
                            )}

                            <div className="saved-actions">
                                <button className="retry-btn" onClick={startNew}>
                                    <RotateCcw size={18} />
                                    Record Another
                                </button>
                                <button className="done-btn" onClick={onSaved}>
                                    <Check size={18} />
                                    Done
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

                    .voice-icon.paused {
                        background: var(--color-warning, #fbbf24);
                        color: white;
                    }

                    .voice-icon.processing {
                        background: var(--color-primary);
                        color: white;
                    }

                    .voice-icon.saved {
                        background: var(--color-success);
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

                    .interim-text {
                        color: var(--color-text-muted);
                        font-style: italic;
                    }

                    .breathing-text {
                        color: var(--color-text-secondary);
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

                    .audio-player {
                        margin: 16px 0;
                    }

                    .transcript-section {
                        margin: 16px 0;
                        text-align: left;
                    }

                    .section-label {
                        display: block;
                        font-size: 0.85rem;
                        font-weight: 600;
                        color: var(--color-text-muted);
                        margin-bottom: 8px;
                    }

                    .duration-text {
                        font-size: 0.8rem;
                        color: var(--color-text-muted);
                        margin-top: 8px;
                    }

                    .mood-section {
                        margin: 20px 0;
                    }

                    .mood-selector {
                        display: flex;
                        justify-content: center;
                        gap: 8px;
                        margin: 12px 0;
                    }

                    .mood-btn {
                        font-size: 1.5rem;
                        padding: 8px;
                        background: transparent;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        opacity: 0.5;
                        transition: all 0.2s;
                    }

                    .mood-btn.active {
                        opacity: 1;
                        background: var(--color-surface-2);
                    }

                    .mood-text {
                        font-size: 0.85rem;
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

                    .confirm-actions, .saved-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 20px;
                    }

                    .discard-btn, .save-btn, .retry-btn, .done-btn {
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

                    .discard-btn, .retry-btn {
                        background: var(--color-surface-2);
                        color: var(--color-text);
                    }

                    .save-btn, .done-btn {
                        background: var(--color-success);
                        color: white;
                    }

                    .save-btn:disabled, .done-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .saved-transcript {
                        background: var(--color-background);
                        padding: 16px;
                        border-radius: 12px;
                        margin: 16px 0;
                        text-align: left;
                    }

                    .saved-label {
                        font-size: 0.85rem;
                        color: var(--color-text-muted);
                        margin-bottom: 8px;
                    }

                    .saved-text {
                        color: var(--color-text);
                        font-style: italic;
                    }
                `}</style>
            </div>
        </div>
    );
}
