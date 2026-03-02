'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Loader2, ChevronDown, MessageSquare, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { getIcon } from '@/lib/icons';
import { useVAD } from '@/hooks/useVAD';

// Coach interface
interface Coach {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    type: 'default' | 'goal' | 'custom';
    isGoalCoach?: boolean;
    systemPrompt?: string;
}

// Default coaches
const DEFAULT_COACHES: Coach[] = [
    { id: 'general', name: 'General', icon: '🧠', color: '#8b5cf6', description: 'Holistic transformation', type: 'default' },
    { id: 'health', name: 'Health', icon: '💪', color: '#ef4444', description: 'Fitness & vitality', type: 'default' },
    { id: 'habits', name: 'Habits', icon: '🔄', color: '#f59e0b', description: 'Routine & consistency', type: 'default' },
    { id: 'emotional', name: 'Emotional', icon: '💜', color: '#ec4899', description: 'EQ & resilience', type: 'default' },
    { id: 'languages', name: 'Languages', icon: '🗣️', color: '#3b82f6', description: 'Fluency & immersion', type: 'default' },
    { id: 'mobility', name: 'Mobility', icon: '🧘', color: '#10b981', description: 'Movement & flexibility', type: 'default' },
];

// State machine types
type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
type ErrorType = 'mic_denied' | 'mic_unavailable' | 'chat_failed' | 'generic' | 'transcription_failed' | 'recording_too_short' | 'no_audio' | 'empty_transcription' | 'transcription_timeout' | 'chat_timeout';

const TRANSCRIPTION_TIMEOUT = 30000;
const CHAT_TIMEOUT = 60000;

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const diffId = (idx: number) => `hist-${Date.now()}-${idx}`;

const getErrorMessage = (errorType: ErrorType): { title: string; hint: string } => {
    switch (errorType) {
        case 'mic_denied':
            return { title: 'Microphone access denied', hint: 'Please allow microphone access.' };
        case 'mic_unavailable':
            return { title: 'No microphone found', hint: 'Please connect a microphone.' };
        case 'chat_failed':
            return { title: 'Connection error', hint: 'Failed to reach the coach.' };
        case 'transcription_failed':
            return { title: 'Transcription failed', hint: 'Could not process audio.' };
        case 'recording_too_short':
            return { title: 'Too short', hint: 'Keep speaking a bit longer.' };
        case 'no_audio':
            return { title: 'No audio', hint: 'Check your microphone.' };
        default:
            return { title: 'Something went wrong', hint: 'Please try again.' };
    }
};

export default function LiveVoiceChat() {
    // Core state
    const [orbState, setOrbState] = useState<OrbState>('idle');
    const [error, setError] = useState<string>('');
    const [errorType, setErrorType] = useState<ErrorType>('generic');
    const [mounted, setMounted] = useState(false);

    // Media Stream
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

    // VAD
    const { isSpeaking, volume } = useVAD({
        stream: activeStream,
        speechThreshold: 0.03,
        startWindow: 300,
        endWindow: 1200
    });

    // Recording
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);

    // Chat
    const [messages, setMessages] = useState<Message[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>(DEFAULT_COACHES);
    const [selectedCoach, setSelectedCoach] = useState<Coach>(DEFAULT_COACHES[0]);
    const [showCoachSelector, setShowCoachSelector] = useState(false);

    // Audio Playback
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const chatAbortControllerRef = useRef<AbortController | null>(null);

    // Helper to set error
    const setErrorWithType = useCallback((type: ErrorType, customMessage?: string) => {
        setErrorType(type);
        const { title } = getErrorMessage(type);
        setError(customMessage || title);
        setOrbState('error');
    }, []);

    // Initialization
    useEffect(() => {
        setMounted(true);
        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setActiveStream(stream);
                setOrbState('idle');
            } catch (err: unknown) {
                console.error("Mic access denied", err);
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setErrorWithType('mic_denied');
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        setErrorWithType('mic_unavailable');
                    } else {
                        setErrorWithType('generic', 'Could not access microphone.');
                    }
                } else {
                    setErrorWithType('generic', 'Could not access microphone.');
                }
            }
        };
        initAudio();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(t => t.stop());
            }
            if (chatAbortControllerRef.current) {
                chatAbortControllerRef.current.abort();
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Play TTS
    const playTTSAudio = useCallback(async (text: string) => {
        if (isMuted || !text.trim()) {
            setOrbState('idle');
            return;
        }

        const cleanText = text.replace(/<<<\{.*?\}>>>/g, '').trim();
        if (!cleanText) {
            setOrbState('idle');
            return;
        }

        const truncatedText = cleanText.length > 4096 ? cleanText.slice(0, 4096) : cleanText;

        try {
            setOrbState('speaking');
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: truncatedText })
            });

            if (!response.ok) {
                setOrbState('idle');
                return;
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setOrbState('idle');
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            audio.onerror = () => {
                setOrbState('idle');
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            await audio.play().catch(() => {
                setOrbState('idle');
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            });

        } catch {
            setOrbState('idle');
        }
    }, [isMuted]);

    const stopTTSPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
            audioRef.current = null;
        }
        setOrbState('idle');
    }, []);

    // Sending Message
    const sendMessage = useCallback(async (text: string, currentHistory: Message[]) => {
        if (chatAbortControllerRef.current) {
            chatAbortControllerRef.current.abort();
        }

        const controller = new AbortController();
        chatAbortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT);

        const assistantMessageId = `msg-${Date.now() + 1}`;
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const response = await fetch('/api/expert/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `[LIVE VOICE MODE - Reply in 2-3 short sentences MAX. Be conversational and concise, like a real voice conversation.] ${text}`,
                    history: currentHistory.slice(-6),
                    coachId: selectedCoach.id
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let accumulatedText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                accumulatedText += parsed.text;
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: msg.content + parsed.text }
                                        : msg
                                ));
                            } else if (parsed.error) {
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: "Connection error." }
                                        : msg
                                ));
                            }
                        } catch { }
                    }
                }
            }

            chatAbortControllerRef.current = null;
            if (accumulatedText) {
                await playTTSAudio(accumulatedText);
            } else {
                setOrbState('idle');
            }

        } catch (err: unknown) {
            clearTimeout(timeoutId);
            chatAbortControllerRef.current = null;
            if (err instanceof Error && err.name === 'AbortError') {
                setErrorWithType('chat_timeout', 'Response timed out.');
            } else {
                setErrorWithType('chat_failed', 'Connection failed.');
            }
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: "Connection error." }
                    : msg
            ));
        }
    }, [playTTSAudio, selectedCoach.id, setErrorWithType]);

    const stopRecordingAndSend = useCallback(async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

        await new Promise<void>(resolve => {
            if (!mediaRecorderRef.current) return resolve();
            mediaRecorderRef.current.onstop = () => resolve();
            mediaRecorderRef.current.stop();
        });

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 1000) {
            setOrbState('idle');
            return;
        }

        setOrbState('processing');

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');

            const transRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
            const transData = await transRes.json();
            const text = transData.data?.text;

            if (text && text.trim().length > 0) {
                const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
                setMessages(prev => [...prev, userMsg]);
                await sendMessage(text, [...messages, userMsg]);
            } else {
                setOrbState('idle');
            }

        } catch (e) {
            console.error("Transcription error:", e);
            setErrorWithType('transcription_failed');
            setTimeout(() => setOrbState('idle'), 3000);
        }
    }, [messages, sendMessage, setErrorWithType]);

    const startRecording = useCallback(() => {
        if (!activeStream) return;
        setError('');
        setErrorType('generic');
        stopTTSPlayback();

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        const mediaRecorder = new MediaRecorder(activeStream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        recordingStartTimeRef.current = Date.now();

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.start();
        setOrbState('listening');
    }, [activeStream, stopTTSPlayback]);

    // VAD Effect
    useEffect(() => {
        if (!activeStream || orbState === 'processing' || orbState === 'error') return;

        if (isSpeaking) {
            if (orbState === 'idle' || orbState === 'speaking') {
                startRecording();
            }
        } else {
            if (orbState === 'listening') {
                stopRecordingAndSend();
            }
        }
    }, [isSpeaking, activeStream, orbState, startRecording, stopRecordingAndSend]);

    // Coaches loading
    useEffect(() => {
        const fetchCoaches = async () => {
            try {
                const [goalsRes, coachesRes] = await Promise.all([
                    fetch('/api/goals'),
                    fetch('/api/coaches')
                ]);
                const goalsData = await goalsRes.json();
                const coachesData = await coachesRes.json();

                let newCoaches = [...DEFAULT_COACHES];
                if (goalsData.success && goalsData.data.goals) {
                    newCoaches = [...newCoaches, ...goalsData.data.goals.map((goal: any) => ({
                        id: goal.id,
                        name: goal.title,
                        icon: getIcon(goal.domain?.icon),
                        color: goal.domain?.color || '#3b82f6',
                        description: 'Goal Coach',
                        type: 'goal' as const,
                        isGoalCoach: true
                    }))];
                }
                if (coachesData.success && coachesData.data.coaches) {
                    newCoaches = [...newCoaches, ...coachesData.data.coaches.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        icon: getIcon(c.icon),
                        color: c.color,
                        description: 'Custom Coach',
                        type: 'custom' as const,
                        systemPrompt: c.systemPrompt
                    }))];
                }
                setCoaches(newCoaches);

                const savedCoachId = localStorage.getItem('liveVoiceCoachId');
                if (savedCoachId) {
                    const saved = newCoaches.find(c => c.id === savedCoachId);
                    if (saved) setSelectedCoach(saved);
                }
            } catch { }
        };
        fetchCoaches();
    }, []);

    // Save coach
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        if (selectedCoach) localStorage.setItem('liveVoiceCoachId', selectedCoach.id);
    }, [selectedCoach]);

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            setMessages([]);
            try {
                const response = await fetch(`/api/expert/chat?coachId=${selectedCoach.id}`);
                const data = await response.json();
                if (data.success && data.data.messages) {
                    const loadedMessages = data.data.messages.map((msg: any, index: number) => ({
                        id: msg.id || diffId(index),
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
                    }));
                    if (loadedMessages.length > 0) setMessages(loadedMessages);
                }
            } catch { }
        };
        fetchHistory();
    }, [selectedCoach]);

    // UI Helpers
    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem('liveVoiceMuted', String(newMuted));
        if (newMuted) stopTTSPlayback();
    };

    const getOrbColor = () => {
        if (orbState === 'error') return '#ef4444';
        if (orbState === 'processing') return '#a855f7';
        if (orbState === 'speaking') return '#22c55e';
        if (orbState === 'listening') return '#f59e0b';
        return selectedCoach.color;
    };

    const orbScale = orbState === 'listening' ? 1 + volume * 1.5 : 1;

    if (!mounted) return null;

    return (
        <div className="live-voice-chat">
            <Link href="/expert" className="back-button"><ArrowLeft size={24} /></Link>

            <button
                className={`mute-toggle-btn ${isMuted ? 'muted' : ''}`}
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute TTS' : 'Mute TTS'}
            >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            <div className="coach-selector-container">
                <button className="coach-selector-btn" onClick={() => setShowCoachSelector(!showCoachSelector)}>
                    <span className="coach-icon" style={{ background: selectedCoach.color }}>{selectedCoach.icon}</span>
                    <span className="coach-name">{selectedCoach.name}</span>
                    <ChevronDown size={16} className={`chevron ${showCoachSelector ? 'open' : ''}`} />
                </button>
                {showCoachSelector && (
                    <div className="coach-dropdown">
                        <div className="dropdown-section">
                            <div className="dropdown-section-title">Coaches</div>
                            {coaches.filter(c => c.type === 'default').map(coach => (
                                <button key={coach.id} className={`coach-option ${selectedCoach.id === coach.id ? 'active' : ''}`} onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}>
                                    <span className="coach-option-icon" style={{ background: coach.color }}>{coach.icon}</span>
                                    <span className="coach-option-name">{coach.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="orb-container">
                <div className="orb" style={{
                    backgroundColor: getOrbColor(),
                    transform: `scale(${orbScale})`,
                    boxShadow: `0 0 ${Math.max(20, volume * 100)}px ${getOrbColor()}`
                }}>
                    {orbState === 'processing' && <Loader2 className="animate-spin" color="white" size={40} />}
                    {orbState === 'idle' && <span className="orb-icon">{selectedCoach.icon}</span>}
                    {orbState === 'listening' && <Mic color="white" size={40} />}
                    {orbState === 'speaking' && <Volume2 color="white" size={40} />}
                    {orbState === 'error' && <VolumeX color="white" size={40} />}
                </div>

                <h2 className="status-text">
                    {orbState === 'idle' && "Listening... (Hands-Free)"}
                    {orbState === 'listening' && "I hear you..."}
                    {orbState === 'processing' && "Thinking..."}
                    {orbState === 'speaking' && "Speaking..."}
                    {orbState === 'error' && error}
                </h2>
            </div>

            <div className="transcript">
                {messages.slice(-2).map(m => (
                    <p key={m.id} className={m.role}>
                        <strong>{m.role === 'user' ? 'You' : selectedCoach.name}:</strong> {m.content}
                    </p>
                ))}
            </div>

            <style jsx>{`
                .live-voice-chat {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #0f172a;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                .back-button {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    color: white;
                    opacity: 0.7;
                    z-index: 10;
                }
                .mute-toggle-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    z-index: 10;
                }
                .coach-selector-container {
                    position: absolute;
                    top: 80px;
                    z-index: 20;
                }
                .coach-selector-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 30px;
                    padding: 8px 16px 8px 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: white;
                    cursor: pointer;
                    backdrop-filter: blur(10px);
                }
                .coach-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }
                .orb-container {
                     display: flex;
                     flex-direction: column;
                     align-items: center;
                     gap: 30px;
                     margin-top: -50px;
                }
                .orb {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.1s ease-out, background-color 0.3s ease;
                }
                .orb-icon { font-size: 4rem; }
                .status-text {
                    font-size: 1.2rem;
                    opacity: 0.8;
                    min-height: 30px;
                    text-align: center;
                }
                .transcript {
                    position: absolute;
                    bottom: 40px;
                    width: 90%;
                    max-width: 600px;
                    text-align: center;
                    opacity: 0.7;
                    font-size: 0.95rem;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .transcript p { 
                    margin: 0; 
                    padding: 8px 12px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 12px;
                }
                .coach-dropdown {
                    position: absolute;
                    top: 50px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1e293b;
                    border-radius: 16px;
                    padding: 8px;
                    width: 280px;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    max-height: 400px;
                    overflow-y: auto;
                }
                .coach-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    border: none;
                    background: transparent;
                    color: white;
                    cursor: pointer;
                    border-radius: 8px;
                    text-align: left;
                }
                .coach-option:hover {
                    background: rgba(255,255,255,0.05);
                }
                .coach-option.active {
                    background: rgba(59, 130, 246, 0.2);
                }
                .coach-option-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }
                .dropdown-section-title {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: rgba(255,255,255,0.4);
                    margin: 8px 8px 4px;
                }
                .chevron { transition: transform 0.2s; }
                .chevron.open { transform: rotate(180deg); }
            `}</style>
        </div>
    );
}
