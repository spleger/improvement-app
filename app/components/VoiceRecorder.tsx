'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Save, Trash2, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
    onSave: (transcript: string, duration: number) => Promise<void>;
}

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [duration, setDuration] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initialize Web Speech API
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let finalText = '';
                    let interim = '';

                    for (let i = 0; i < event.results.length; i++) {
                        const result = event.results[i];
                        if (result.isFinal) {
                            finalText += result[0].transcript + ' ';
                        } else {
                            interim += result[0].transcript;
                        }
                    }

                    // Update final transcript (accumulated)
                    if (finalText) {
                        setTranscript(finalText.trim());
                    }
                    // Update interim (what's being spoken right now)
                    setInterimText(interim);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'not-allowed') {
                        setError('Microphone access denied. Please allow microphone access.');
                        stopRecording();
                    } else if (event.error === 'no-speech') {
                        // Ignore this, it's just a timeout
                    } else {
                        setError(`Recognition error: ${event.error}`);
                    }
                };

                recognition.onend = () => {
                    // Auto-restart if we're still supposed to be recording
                    if (isRecording && recognitionRef.current) {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            // Already started, ignore
                        }
                    }
                };

                recognitionRef.current = recognition;
            } else {
                setIsSupported(false);
                setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
            }
        };
    }, [isRecording]);

    const startRecording = () => {
        if (!recognitionRef.current || !isSupported) return;

        setError(null);
        setInterimText('');

        try {
            recognitionRef.current.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (e) {
            setError('Failed to start recording. Please try again.');
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
        setInterimText('');
    };

    const handleSave = async () => {
        const finalText = transcript.trim();
        if (!finalText) return;

        setIsSaving(true);
        try {
            await onSave(finalText, duration);
            setTranscript('');
            setInterimText('');
            setDuration(0);
        } catch (err) {
            setError('Failed to save entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => {
        stopRecording();
        setTranscript('');
        setInterimText('');
        setDuration(0);
        setError(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayText = transcript + (interimText ? ` ${interimText}` : '');

    return (
        <div className="voice-recorder-card">
            <div className="voice-recorder-header">
                <h3 className="voice-recorder-title">🎙️ Voice Journal</h3>
                <div className="voice-recorder-timer">
                    {formatTime(duration)}
                </div>
            </div>

            {error && (
                <div className="voice-recorder-error">
                    {error}
                </div>
            )}

            <div className="voice-recorder-textarea-wrapper">
                <textarea
                    value={displayText}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={isRecording ? "🎤 Listening... Speak now!" : "Tap 'Start Recording' to begin..."}
                    className="voice-recorder-textarea"
                    readOnly={isRecording}
                />

                {isRecording && (
                    <div className="voice-recorder-pulse">
                        <span className="voice-recorder-pulse-ring"></span>
                        <span className="voice-recorder-pulse-dot"></span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="voice-recorder-actions">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={!isSupported}
                        className="voice-recorder-btn voice-recorder-btn-start"
                    >
                        <Mic size={20} />
                        Start Recording
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="voice-recorder-btn voice-recorder-btn-stop"
                    >
                        <Square size={18} fill="currentColor" />
                        Stop
                    </button>
                )}

                {transcript && !isRecording && (
                    <>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="voice-recorder-btn voice-recorder-btn-save"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Save Entry
                        </button>

                        <button
                            onClick={handleClear}
                            disabled={isSaving}
                            className="voice-recorder-btn voice-recorder-btn-clear"
                        >
                            <Trash2 size={18} />
                            Clear
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                .voice-recorder-card {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    padding: 24px;
                }
                
                .voice-recorder-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .voice-recorder-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--color-text);
                }
                
                .voice-recorder-timer {
                    background: var(--color-surface-2);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-family: monospace;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--color-text);
                }
                
                .voice-recorder-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    margin-bottom: 16px;
                }
                
                .voice-recorder-textarea-wrapper {
                    position: relative;
                    margin-bottom: 16px;
                }
                
                .voice-recorder-textarea {
                    width: 100%;
                    height: 140px;
                    background: var(--color-surface-2);
                    border: 2px solid var(--color-border);
                    border-radius: 12px;
                    padding: 16px;
                    resize: none;
                    font-size: 1rem;
                    line-height: 1.6;
                    color: var(--color-text);
                }
                
                .voice-recorder-textarea:focus {
                    outline: none;
                    border-color: var(--color-primary);
                }
                
                .voice-recorder-textarea::placeholder {
                    color: var(--color-text-muted);
                }
                
                .voice-recorder-pulse {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                }
                
                .voice-recorder-pulse-ring {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #ef4444;
                    opacity: 0.5;
                    animation: pulse-ring 1.5s ease-out infinite;
                }
                
                .voice-recorder-pulse-dot {
                    position: relative;
                    display: block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #ef4444;
                }
                
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                
                .voice-recorder-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .voice-recorder-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex: 1;
                    min-width: 120px;
                }
                
                .voice-recorder-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Start Button - Green */
                .voice-recorder-btn-start {
                    background: #22c55e;
                    color: white;
                }
                .voice-recorder-btn-start:hover:not(:disabled) {
                    background: #16a34a;
                    transform: translateY(-1px);
                }
                
                /* Stop Button - Red */
                .voice-recorder-btn-stop {
                    background: #ef4444;
                    color: white;
                }
                .voice-recorder-btn-stop:hover:not(:disabled) {
                    background: #dc2626;
                    transform: translateY(-1px);
                }
                
                /* Save Button - Blue */
                .voice-recorder-btn-save {
                    background: #3b82f6;
                    color: white;
                }
                .voice-recorder-btn-save:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                
                /* Clear Button - Neutral */
                .voice-recorder-btn-clear {
                    background: #6b7280;
                    color: white;
                }
                .voice-recorder-btn-clear:hover:not(:disabled) {
                    background: #4b5563;
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
}
