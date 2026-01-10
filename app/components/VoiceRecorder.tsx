'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Save, RotateCcw, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
    onSave: (transcript: string, duration: number) => Promise<void>;
}

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [duration, setDuration] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const processedIndexRef = useRef(0);

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
                    let newFinalContent = '';

                    // Only process results we haven't seen finalized yet
                    for (let i = processedIndexRef.current; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            newFinalContent += event.results[i][0].transcript;
                            processedIndexRef.current = i + 1; // Mark as processed
                        }
                    }

                    if (newFinalContent) {
                        setTranscript(prev => {
                            const trimmedPrev = prev.trim();
                            const separator = trimmedPrev ? ' ' : '';
                            const newPart = newFinalContent.trim();
                            return (trimmedPrev + separator + newPart);
                        });
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'not-allowed') {
                        setError('Microphone access denied. Please allow microphone access to use this feature.');
                        setIsRecording(false);
                    }
                };

                recognitionRef.current = recognition;
            } else {
                setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return;

        if (isRecording) {
            recognitionRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRecording(false);
        } else {
            setError(null);
            processedIndexRef.current = 0; // Reset safe index for new session
            recognitionRef.current.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
    };

    const handleSave = async () => {
        if (!transcript.trim()) return;

        setIsSaving(true);
        try {
            await onSave(transcript, duration);
            setTranscript('');
            setDuration(0);
        } catch (err) {
            setError('Failed to save entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card p-lg glass-panel">
            <div className="flex flex-col gap-md">
                <div className="flex justify-between items-center mb-sm">
                    <h3 className="text-xl font-bold gradient-text">Voice Journal</h3>
                    <div className="bg-surface-2 px-3 py-1 rounded-full font-mono text-sm">
                        {formatTime(duration)}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="relative">
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={isRecording ? "Listening..." : "Tap the mic to start recording your thoughts..."}
                        className="w-full h-40 bg-surface-2 border border-border/50 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium leading-relaxed"
                        style={{ opacity: isRecording ? 0.8 : 1 }}
                    />

                    {isRecording && (
                        <div className="absolute top-2 right-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex justify-center gap-md mt-sm">
                    {isRecording ? (
                        <button
                            onClick={toggleRecording}
                            className="btn bg-red-500 hover:bg-red-600 text-white rounded-full p-4 w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                        >
                            <Square size={24} fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            onClick={toggleRecording}
                            className="btn btn-primary rounded-full p-4 w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                        >
                            <Mic size={28} />
                        </button>
                    )}
                </div>

                {transcript && !isRecording && (
                    <div className="flex gap-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={() => { setTranscript(''); setDuration(0); }}
                            className="btn btn-ghost flex-1 gap-2"
                            disabled={isSaving}
                        >
                            <RotateCcw size={18} />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn btn-secondary flex-1 gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Save Entry
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .glass-panel {
                    background: rgba(var(--surface-rgb), 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
