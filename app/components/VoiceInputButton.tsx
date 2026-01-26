'use client';

import { useState, useRef } from 'react';
import { Mic, Loader2 } from 'lucide-react';

interface VoiceInputButtonProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
    className?: string;
}

type VoiceState = 'idle' | 'recording' | 'transcribing';

export default function VoiceInputButton({ onTranscription, disabled, className }: VoiceInputButtonProps) {
    const [state, setState] = useState<VoiceState>('idle');
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = async () => {
        try {
            setError(null);
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
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // Transcribe the audio
                setState('transcribing');
                try {
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'recording.webm');

                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    if (data.text) {
                        onTranscription(data.text);
                    } else if (data.data?.text) {
                        // Handle alternate response format
                        onTranscription(data.data.text);
                    } else {
                        setError('No transcription returned');
                    }
                } catch (err) {
                    console.error('Transcription failed:', err);
                    setError('Transcription failed. Please try again.');
                } finally {
                    setState('idle');
                }
            };

            mediaRecorder.start();
            setState('recording');
        } catch (err) {
            console.error('Microphone access denied:', err);
            setError('Could not access microphone');
            setState('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleClick = () => {
        if (state === 'idle') {
            startRecording();
        } else if (state === 'recording') {
            stopRecording();
        }
        // If transcribing, do nothing (button is disabled)
    };

    const isDisabled = disabled || state === 'transcribing';

    return (
        <div className="voice-input-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                type="button"
                onClick={handleClick}
                disabled={isDisabled}
                className={`voice-input-btn ${state} ${className || ''}`}
                title={state === 'recording' ? 'Tap to stop' : state === 'transcribing' ? 'Transcribing...' : 'Tap to record'}
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: state === 'recording'
                        ? '#ef4444'
                        : state === 'transcribing'
                            ? 'var(--color-primary)'
                            : 'var(--color-surface-2)',
                    color: state === 'idle' ? 'var(--color-text-secondary)' : 'white',
                    transition: 'all 0.2s ease',
                    opacity: isDisabled && state !== 'transcribing' ? 0.5 : 1,
                }}
            >
                {state === 'transcribing' ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Mic size={20} />
                )}
            </button>

            {error && (
                <span style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.7rem',
                    color: 'var(--color-error)',
                    whiteSpace: 'nowrap'
                }}>
                    {error}
                </span>
            )}

            <style jsx>{`
                .voice-input-btn.recording {
                    animation: breathe 1.5s ease-in-out infinite;
                }
                
                @keyframes breathe {
                    0%, 100% { 
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
                    }
                    50% { 
                        transform: scale(1.08);
                        box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
                    }
                }
                
                .voice-input-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                }
                
                .voice-input-btn.recording:hover {
                    animation: none;
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
