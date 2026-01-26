'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Save, Trash2, Loader2, RefreshCw } from 'lucide-react';

// Extend Window interface for Speech Recognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface VoiceRecorderProps {
    onSave: (transcript: string, duration: number) => Promise<void>;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'processing' | 'saved';

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
    const [moodScore, setMoodScore] = useState(5);
    const [isSaving, setIsSaving] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<any>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
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
            setTranscriptionError(null);
            setTranscript('');
            setInterimTranscript('');

            // 1. Setup Audio Recording (MediaRecorder)
            // This works offline and is robust
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

            mediaRecorder.start(1000);

            // 2. Setup Speech Recognition (Optional / Fragile)
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';
                recognition.stoppedExplicitly = false;

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
                        setTranscriptionError('Microphone access denied for transcription.');
                    } else if (event.error === 'network') {
                        // Check HTTPS
                        const isHttps = window.location.protocol === 'https:';
                        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        if (!isHttps && !isLocalhost) {
                            setTranscriptionError('Transcription requires HTTPS. Please use a secure connection.');
                        } else if (navigator.userAgent.includes('Firefox')) {
                            setTranscriptionError('Firefox has limited speech recognition support. Try Chrome or Edge.');
                        } else {
                            setTranscriptionError('Speech service unavailable. Check your internet connection or try Chrome.');
                        }
                        // Do NOT stop recording audio
                    } else if (event.error === 'no-speech') {
                        // Ignore
                    } else {
                        setTranscriptionError(`Transcription error: ${event.error}`);
                    }
                };

                recognition.onend = () => {
                    // Try to restart if we are still recording and haven't stopped explicitly
                    // But check if we encountered a persistent error
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && recognitionRef.current && !recognitionRef.current.stoppedExplicitly) {
                        if (!transcriptionError) {
                            try { recognitionRef.current.start(); } catch (e) { }
                        }
                    }
                };

                recognitionRef.current = recognition;
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Failed to start recognition', e);
                }
            } else {
                setTranscriptionError('Browser does not support live transcription (Audio only).');
            }

            setState('recording');
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please allow permissions.');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.pause();
            if (recognitionRef.current) {
                recognitionRef.current.stoppedExplicitly = true;
                try { recognitionRef.current.stop(); } catch (e) { }
            }
            setState('paused');
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && state === 'paused') {
            mediaRecorderRef.current.resume();
            if (recognitionRef.current && !transcriptionError) {
                try {
                    recognitionRef.current.stoppedExplicitly = false;
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
                recognitionRef.current.stoppedExplicitly = true;
                try { recognitionRef.current.stop(); } catch (e) { }
            }
            setState('stopped');
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            // Add any final interim text
            if (interimTranscript) {
                setTranscript(prev => prev + interimTranscript + ' ');
                setInterimTranscript('');
            }
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
        setTranscriptionError(null);
    };

    const handleSave = async () => {
        setState('processing');
        setIsSaving(true);
        try {
            let finalTranscript = transcript;

            // If we have no transcript (common on mobile where Web Speech API failed),
            // try server-side transcription with the recorded audio.
            if ((!finalTranscript || finalTranscript.trim().length === 0) && audioUrl) {
                try {
                    // Convert the blob url back to blob
                    const response = await fetch(audioUrl);
                    const blob = await response.blob();

                    const formData = new FormData();
                    formData.append('file', blob, 'recording.webm');

                    const transcribeReq = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData
                    });

                    if (transcribeReq.ok) {
                        const data = await transcribeReq.json();
                        if (data.text) {
                            finalTranscript = data.text;
                            setTranscript(finalTranscript); // Update UI
                        }
                    } else {
                        console.error('Server transcription failed', await transcribeReq.text());
                    }
                } catch (e) {
                    console.error('Failed to prepare audio for server transcription', e);
                }
            }

            await onSave(finalTranscript, duration);
            setState('saved');
        } catch (err) {
            console.error('Error saving:', err);
            setError('Failed to save entry. Please try again.');
            setState('stopped'); // Go back to review
        } finally {
            setIsSaving(false);
        }
    };

    const startNew = () => {
        discardRecording();
        setMoodScore(5);
    };

    return (
        <div className="voice-recorder card-glass boxed-accent-top">
            {/* Error Message */}
            {error && (
                <div className="mb-lg p-md" style={{ borderLeft: '4px solid var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Transcription Warning */}
            {transcriptionError && state === 'recording' && (
                <div className="mb-md p-sm text-sm" style={{ borderLeft: '4px solid var(--color-warning)', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning)' }}>
                    ⚠️ {transcriptionError}
                </div>
            )}

            {/* Idle State */}
            {state === 'idle' && (
                <div className="text-center py-xl">
                    <button
                        onClick={startRecording}
                        className="record-button"
                        style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                            transition: 'transform 0.2s',
                            color: 'white'
                        }}
                    >
                        <Mic size={40} />
                    </button>
                    <h3 className="heading-4 mb-sm">Tap to Record</h3>
                    <p className="text-muted text-small">
                        Speak naturally. Audio is recorded even if transcription fails.
                    </p>
                </div>
            )}

            {/* Recording State */}
            {(state === 'recording' || state === 'paused') && (
                <div className="text-center">
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: state === 'recording' ? '#ef4444' : '#fbbf24',
                        margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                        animation: state === 'recording' ? 'pulse 1.5s infinite' : 'none'
                    }}>
                        {state === 'recording' ? <Mic size={32} /> : <Square size={32} />}
                    </div>

                    <div className="heading-2 mb-md font-mono">{formatDuration(duration)}</div>

                    {/* Live Transcript */}
                    <div className="mb-lg text-left" style={{ minHeight: '100px', maxHeight: '200px', overflowY: 'auto', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', border: '1px solid var(--color-border)' }}>
                        <p style={{ margin: 0 }}>
                            {transcript}
                            <span className="text-muted italic">{interimTranscript}</span>
                            {!transcript && !interimTranscript && (
                                <span className="text-muted">Listening...</span>
                            )}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-md">
                        {state === 'recording' ? (
                            <button onClick={pauseRecording} className="btn btn-secondary flex items-center gap-sm">
                                ⏸️ Pause
                            </button>
                        ) : (
                            <button onClick={resumeRecording} className="btn btn-secondary flex items-center gap-sm">
                                ▶️ Resume
                            </button>
                        )}
                        <button onClick={stopRecording} className="btn btn-primary flex items-center gap-sm">
                            <Square size={18} fill="currentColor" /> Done
                        </button>
                    </div>
                </div>
            )}

            {/* Stopped / Review State */}
            {state === 'stopped' && (
                <div>
                    <h3 className="heading-4 mb-md text-center">Review Recording</h3>

                    {audioUrl && (
                        <div className="mb-lg">
                            <audio controls src={audioUrl} style={{ width: '100%' }} />
                        </div>
                    )}

                    <div className="mb-lg">
                        <label className="form-label">Transcript (Edit if needed)</label>
                        <textarea
                            className="form-input w-full h-32"
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Add your notes here if transcription failed..."
                        />
                    </div>

                    <div className="flex gap-md mt-lg">
                        <button onClick={discardRecording} className="btn btn-ghost text-error">
                            <Trash2 size={18} /> Discard
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex-1 flex justify-center gap-sm">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            Save Entry
                        </button>
                    </div>
                </div>
            )}

            {/* Finished State */}
            {state === 'saved' && (
                <div className="text-center py-xl">
                    <div className="text-5xl mb-md">✅</div>
                    <h3 className="heading-4 mb-md">Entry Saved!</h3>
                    <button onClick={startNew} className="btn btn-primary">
                        <RefreshCw size={18} className="mr-2" /> Record Another
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
