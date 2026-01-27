'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Save, Trash2, Loader2, Play, Pause, RefreshCw, RotateCcw } from 'lucide-react';

interface VoiceRecorderProps {
    onSave: (transcript: string, duration: number) => Promise<void>;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'review' | 'saved';

// Transcription timeout in milliseconds (30 seconds)
const TRANSCRIPTION_TIMEOUT = 30000;

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [canRetryTranscription, setCanRetryTranscription] = useState(false);

    // Audio Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioBlobRef = useRef<Blob | null>(null);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                audioBlobRef.current = audioBlob; // Store for retry capability
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());

                // Auto-transcribe on stop
                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();
            setState('recording');
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);

        } catch (err) {
            console.error('Microphone Error:', err);
            setError('Could not access microphone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
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

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.text || data.data?.text || '';

            if (text) {
                setTranscript(text);
            } else {
                setTranscript('');
            }
            setState('review');
        } catch (err: any) {
            clearTimeout(timeoutId);

            if (err.name === 'AbortError') {
                setError('Transcription timed out. Please retry.');
            } else {
                setError('Transcription failed. Please retry or edit manually.');
            }
            setCanRetryTranscription(true);
            setState('review');
        }
    };

    const retryTranscription = async () => {
        if (audioBlobRef.current) {
            await transcribeAudio(audioBlobRef.current);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(transcript, duration);
            setState('saved');
        } catch (err) {
            setError('Failed to save entry.');
            setIsSaving(false);
        }
    };

    const discardRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setTranscript('');
        setDuration(0);
        setState('idle');
        chunksRef.current = [];
        audioBlobRef.current = null;
        setError(null);
        setCanRetryTranscription(false);
    };

    const togglePlayback = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const startNew = () => {
        discardRecording();
        setState('idle');
    };

    return (
        <div className="voice-recorder card-glass boxed-accent-top">
            {error && (
                <div className="error-container mb-lg p-md" style={{ borderLeft: '4px solid var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)' }}>
                    <div className="error-message">{error}</div>
                    {canRetryTranscription && (
                        <button
                            onClick={retryTranscription}
                            className="retry-transcription-btn"
                            style={{
                                marginTop: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                background: 'var(--color-error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.9rem'
                            }}
                        >
                            <RotateCcw size={16} />
                            Retry Transcription
                        </button>
                    )}
                </div>
            )}

            {/* IDLE */}
            {state === 'idle' && (
                <div className="text-center py-xl">
                    <button onClick={startRecording} className="voice-record-btn idle">
                        <Mic size={40} />
                    </button>
                    <h3 className="heading-4 mb-sm">Tap to Record</h3>
                    <p className="text-muted text-small">Voice Diary Entry</p>
                </div>
            )}

            {/* RECORDING */}
            {state === 'recording' && (
                <div className="text-center py-xl">
                    <div className="voice-record-btn recording">
                        <Mic size={40} />
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring delay"></div>
                    </div>
                    <div className="heading-2 mb-md font-mono">{formatDuration(duration)}</div>
                    <div className="breathing-text">Listening... Tap to stop</div>
                    <button onClick={stopRecording} className="btn btn-error mt-lg flex items-center gap-sm mx-auto">
                        <Square size={20} fill="currentColor" /> Stop
                    </button>
                </div>
            )}

            {/* PROCESSING */}
            {state === 'processing' && (
                <div className="text-center py-xl">
                    <div className="voice-record-btn processing">
                        <Loader2 size={40} className="spin" />
                    </div>
                    <h3 className="heading-4 mt-md">Processing Audio...</h3>
                </div>
            )}

            {/* REVIEW */}
            {state === 'review' && (
                <div className="review-container">
                    <h3 className="heading-4 mb-md text-center">Review Entry</h3>

                    {audioUrl && (
                        <div className="audio-player mb-lg">
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onEnded={() => setIsPlaying(false)}
                                onPause={() => setIsPlaying(false)}
                                onPlay={() => setIsPlaying(true)}
                                style={{ display: 'none' }}
                            />
                            <button onClick={togglePlayback} className="play-btn">
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <div className="audio-waveform">
                                {/* Visual placeholder for waveform */}
                                <div className="wave-bar" style={{ height: '40%' }}></div>
                                <div className="wave-bar" style={{ height: '70%' }}></div>
                                <div className="wave-bar" style={{ height: '100%' }}></div>
                                <div className="wave-bar" style={{ height: '60%' }}></div>
                                <div className="wave-bar" style={{ height: '80%' }}></div>
                                <div className="wave-bar" style={{ height: '50%' }}></div>
                            </div>
                            <span className="duration">{formatDuration(duration)}</span>
                        </div>
                    )}

                    <div className="mb-lg">
                        <label className="form-label">Transcript</label>
                        <textarea
                            className="form-input w-full h-40 custom-scrollbar"
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Transcription will appear here..."
                        />
                    </div>

                    <div className="flex gap-md">
                        <button onClick={discardRecording} className="btn btn-ghost text-error">
                            <Trash2 size={20} /> Discard
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex-1 flex justify-center gap-sm">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Save Entry
                        </button>
                    </div>
                </div>
            )}

            {/* Finished State */}
            {state === 'saved' && (
                <div className="text-center py-xl">
                    <div className="text-5xl mb-md">✅</div>
                    <h3 className="heading-4">Entry Saved!</h3>
                    <p className="text-muted mb-lg">Your voice diary entry has been recorded.</p>
                    <button onClick={startNew} className="btn btn-primary flex items-center gap-sm mx-auto">
                        <RefreshCw size={18} /> Record Another
                    </button>
                </div>
            )}

            <style jsx>{`
                .voice-record-btn {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s;
                    color: white;
                    position: relative;
                }
                
                .voice-record-btn.idle {
                    background: var(--gradient-primary);
                    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
                }
                
                .voice-record-btn.idle:hover {
                    transform: scale(1.05);
                }

                .voice-record-btn.recording {
                    background: var(--color-error);
                    animation: breathe 1.5s ease-in-out infinite;
                }

                .voice-record-btn.processing {
                    background: var(--color-surface-2);
                    color: var(--color-primary);
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

                @keyframes breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .breathing-text {
                    color: var(--color-error);
                    font-weight: 500;
                    animation: textBreathe 1.5s ease-in-out infinite;
                }

                @keyframes textBreathe {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }

                .audio-player {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: var(--color-surface-2);
                    padding: 12px 20px;
                    border-radius: 16px;
                }

                .play-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--gradient-primary);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .audio-waveform {
                    flex: 1;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }

                .wave-bar {
                    width: 4px;
                    background: var(--color-primary);
                    border-radius: 2px;
                    opacity: 0.6;
                }

                .duration {
                    font-family: monospace;
                    color: var(--color-text-muted);
                }
            `}</style>
        </div>
    );
}
