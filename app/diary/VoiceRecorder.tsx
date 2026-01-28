'use client';

import { useState, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'processing' | 'saved';

// Transcription timeout in milliseconds (30 seconds)
const TRANSCRIPTION_TIMEOUT = 30000;

// Extend Window interface for Speech Recognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function VoiceRecorder() {
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [moodScore, setMoodScore] = useState(5);

    const [canRetryTranscription, setCanRetryTranscription] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<any>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioBlobRef = useRef<Blob | null>(null);
    // Use ref to track recording state for speech recognition restart logic
    const isRecordingRef = useRef(false);

    // Keep ref in sync with state
    useEffect(() => {
        isRecordingRef.current = state === 'recording';
    }, [state]);

    // Initialize Speech Recognition once on mount
    useEffect(() => {
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
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone permissions.');
                }
                // Other errors like 'no-speech' are normal and don't need user notification
            };

            recognition.onend = () => {
                // Restart if still recording (use ref to get current state)
                if (isRecordingRef.current && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // Already started or other error - ignore
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
    }, []);

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

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                audioBlobRef.current = blob; // Store for retry capability
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Check if Web Speech API captured any transcript
                // Use a small delay to ensure final results are processed
                setTimeout(() => {
                    setTranscript(currentTranscript => {
                        if (!currentTranscript.trim()) {
                            // No speech detected by Web Speech API - fallback to Whisper
                            transcribeWithWhisper(blob);
                        }
                        return currentTranscript;
                    });
                }, 500);
            };

            // Start audio recording
            mediaRecorder.start(1000);

            // Start speech recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // Already started - ignore
                }
            }

            setState('recording');
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);

        } catch (err) {
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

    const transcribeWithWhisper = async (audioBlob: Blob) => {
        setState('processing');
        setError(null);
        setCanRetryTranscription(false);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT);

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            // Check for API error response (standardized format: { success: boolean, data/error })
            if (!response.ok || data.success === false) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            // Extract transcript from standardized API response format
            // API returns: { success: true, data: { text: '...', message?: '...' } }
            const text = data.data?.text ?? '';
            const message = data.data?.message;

            // Set transcript (may be empty if no speech detected)
            setTranscript(text);

            // Handle 'no speech detected' case - show message but still allow manual entry
            if (!text && message) {
                setError(message);
                setCanRetryTranscription(true);
            }

            setState('stopped');
        } catch (err: any) {
            clearTimeout(timeoutId);

            if (err.name === 'AbortError') {
                setError('Transcription timed out. Please retry.');
            } else {
                setError(err.message || 'Transcription failed. Please retry or edit manually.');
            }
            setCanRetryTranscription(true);
            setState('stopped');
        }
    };

    const retryTranscription = async () => {
        if (audioBlobRef.current) {
            await transcribeWithWhisper(audioBlobRef.current);
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
        audioBlobRef.current = null;
        setError(null);
        setCanRetryTranscription(false);
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
            setError('Failed to save entry. Please try again.');
            setState('stopped'); // Return to review state so user can retry
        }
    };

    const startNew = () => {
        discardRecording();
    };

    return (
        <div className="voice-recorder">
            {/* Error Message */}
            {error && (
                <div className="card mb-lg" style={{ borderLeft: '4px solid var(--color-error)' }}>
                    <p style={{ color: 'var(--color-error)' }}>{error}</p>
                    {canRetryTranscription && state === 'stopped' && (
                        <button
                            onClick={retryTranscription}
                            className="btn btn-secondary mt-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RotateCcw size={16} />
                            Retry Transcription
                        </button>
                    )}
                </div>
            )}

            {/* Idle State - Start Recording */}
            {state === 'idle' && (
                <div className="card text-center" style={{ padding: '3rem 2rem' }}>
                    <button
                        onClick={startRecording}
                        className="record-button"
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '3rem' }}>🎙️</span>
                    </button>
                    <h3 className="heading-4 mb-sm">Tap to Record</h3>
                    <p className="text-muted text-small">
                        Speak naturally - your words will be transcribed in real-time
                    </p>
                    <p className="text-tiny text-muted mt-md">
                        Works best in Chrome or Edge
                    </p>
                </div>
            )}

            {/* Recording State */}
            {(state === 'recording' || state === 'paused') && (
                <div className="card text-center" style={{ padding: '2rem' }}>
                    {/* Animated Recording Indicator */}
                    <div
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: state === 'recording' ? '#ef4444' : '#fbbf24',
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: state === 'recording' ? 'pulse 1.5s infinite' : 'none'
                        }}
                    >
                        <span style={{ fontSize: '2.5rem' }}>
                            {state === 'recording' ? '🔴' : '⏸️'}
                        </span>
                    </div>

                    {/* Duration */}
                    <div className="heading-2 mb-md" style={{ fontFamily: 'monospace' }}>
                        {formatDuration(duration)}
                    </div>

                    {/* Live Transcript */}
                    <div className="card card-surface mb-lg text-left" style={{ minHeight: '100px', maxHeight: '200px', overflowY: 'auto' }}>
                        <div className="text-tiny text-muted mb-sm">📝 Live Transcript:</div>
                        <p style={{ margin: 0 }}>
                            {transcript}
                            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                {interimTranscript}
                            </span>
                            {!transcript && !interimTranscript && (
                                <span className="text-muted">Start speaking...</span>
                            )}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-md">
                        {state === 'recording' ? (
                            <button onClick={pauseRecording} className="btn btn-secondary">
                                ⏸️ Pause
                            </button>
                        ) : (
                            <button onClick={resumeRecording} className="btn btn-secondary">
                                ▶️ Resume
                            </button>
                        )}
                        <button onClick={stopRecording} className="btn btn-primary">
                            ⏹️ Done
                        </button>
                    </div>

                    <p className="text-muted text-small mt-lg">
                        {state === 'recording' ? '🎙️ Listening...' : 'Paused'}
                    </p>
                </div>
            )}

            {/* Stopped State - Review */}
            {state === 'stopped' && (
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 className="heading-4 mb-md text-center">Review Recording</h3>

                    {/* Audio Playback */}
                    {audioUrl && (
                        <div className="mb-lg">
                            <audio controls src={audioUrl} style={{ width: '100%' }} />
                        </div>
                    )}

                    {/* Transcript */}
                    <div className="mb-lg">
                        <label className="form-label">📝 Transcript</label>
                        <div className="card card-surface">
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {transcript || 'No transcript captured. Try speaking louder or check your microphone.'}
                            </p>
                        </div>
                        <p className="text-tiny text-muted mt-sm">
                            Duration: {formatDuration(duration)}
                        </p>
                    </div>

                    {/* Mood Selector */}
                    <div className="form-group">
                        <label className="form-label">How are you feeling?</label>
                        <div className="flex justify-center gap-sm mb-sm">
                            {['😢', '😕', '😐', '🙂', '😊'].map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMoodScore((i + 1) * 2)}
                                    style={{
                                        fontSize: '1.5rem',
                                        padding: '0.5rem',
                                        background: moodScore >= (i + 1) * 2 ? 'var(--color-surface-hover)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        opacity: moodScore >= (i + 1) * 2 ? 1 : 0.5,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="text-center text-small text-muted">
                            Mood: {moodScore}/10
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-md mt-lg">
                        <button onClick={discardRecording} className="btn btn-ghost">
                            🗑️ Discard
                        </button>
                        <button onClick={saveRecording} className="btn btn-success" style={{ flex: 1 }}>
                            ✅ Save Entry
                        </button>
                    </div>
                </div>
            )}

            {/* Processing State */}
            {state === 'processing' && (
                <div className="card text-center" style={{ padding: '3rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>
                        ⏳
                    </div>
                    <h3 className="heading-4 mb-sm">Processing...</h3>
                    <p className="text-muted text-small">Transcribing your audio</p>
                </div>
            )}

            {/* Saved State */}
            {state === 'saved' && (
                <div className="card text-center" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h3 className="heading-4 mb-md">Entry Saved!</h3>

                    {transcript && (
                        <div className="card card-surface mb-lg text-left">
                            <div className="text-small text-muted mb-sm">Your reflection:</div>
                            <p style={{ margin: 0 }}>"{transcript}"</p>
                        </div>
                    )}

                    <button onClick={startNew} className="btn btn-primary">
                        🎙️ Record Another
                    </button>
                </div>
            )}

            <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
