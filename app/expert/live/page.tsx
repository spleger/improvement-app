'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Loader2, ChevronDown, MessageSquare, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { getIcon } from '@/lib/icons';

// Coach interface (same as ExpertChat.tsx)
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

// Default coaches (same as ExpertChat.tsx)
const DEFAULT_COACHES: Coach[] = [
    { id: 'general', name: 'General', icon: '🧠', color: '#8b5cf6', description: 'Holistic transformation', type: 'default' },
    { id: 'health', name: 'Health', icon: '💪', color: '#ef4444', description: 'Fitness & vitality', type: 'default' },
    { id: 'habits', name: 'Habits', icon: '🔄', color: '#f59e0b', description: 'Routine & consistency', type: 'default' },
    { id: 'emotional', name: 'Emotional', icon: '💜', color: '#ec4899', description: 'EQ & resilience', type: 'default' },
    { id: 'languages', name: 'Languages', icon: '🗣️', color: '#3b82f6', description: 'Fluency & immersion', type: 'default' },
    { id: 'mobility', name: 'Mobility', icon: '🧘', color: '#10b981', description: 'Movement & flexibility', type: 'default' },
];

// State machine types for The Orb
type OrbState = 'idle' | 'recording' | 'processing' | 'speaking' | 'error';

// Error types for better user feedback
type ErrorType = 'mic_denied' | 'mic_unavailable' | 'mic_in_use' | 'recording_too_short' | 'empty_transcription' | 'transcription_failed' | 'transcription_timeout' | 'chat_failed' | 'chat_timeout' | 'no_audio' | 'generic';

// Transcription timeout in milliseconds (30 seconds)
const TRANSCRIPTION_TIMEOUT = 30000;

// Chat streaming timeout in milliseconds (60 seconds)
const CHAT_TIMEOUT = 60000;

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Helper function to generate unique IDs for messages (same pattern as ExpertChat.tsx)
const diffId = (idx: number) => `hist-${Date.now()}-${idx}`;

// Helper function to get user-friendly error messages based on error type
const getErrorMessage = (errorType: ErrorType): { title: string; hint: string } => {
    switch (errorType) {
        case 'mic_denied':
            return {
                title: 'Microphone access denied',
                hint: 'Please allow microphone access in your browser settings to use voice chat.'
            };
        case 'mic_unavailable':
            return {
                title: 'No microphone found',
                hint: 'Please connect a microphone and try again.'
            };
        case 'mic_in_use':
            return {
                title: 'Microphone is busy',
                hint: 'Another app may be using your microphone. Close it and try again.'
            };
        case 'recording_too_short':
            return {
                title: 'Recording too short',
                hint: 'Hold longer while speaking, then release to send.'
            };
        case 'empty_transcription':
            return {
                title: 'No speech detected',
                hint: 'Try speaking more clearly or moving closer to your microphone.'
            };
        case 'transcription_failed':
            return {
                title: 'Transcription failed',
                hint: 'There was an issue processing your audio. Please try again.'
            };
        case 'transcription_timeout':
            return {
                title: 'Transcription timed out',
                hint: 'The server took too long to respond. Please try again.'
            };
        case 'chat_failed':
            return {
                title: 'Connection error',
                hint: 'Failed to reach the coach. Please check your connection and try again.'
            };
        case 'chat_timeout':
            return {
                title: 'Response timed out',
                hint: 'The coach took too long to respond. Please try again.'
            };
        case 'no_audio':
            return {
                title: 'No audio captured',
                hint: 'Your microphone may not be working properly. Try again.'
            };
        default:
            return {
                title: 'Something went wrong',
                hint: 'Please try again.'
            };
    }
};

export default function LiveVoiceChat() {
    // Core state
    const [orbState, setOrbState] = useState<OrbState>('idle');
    const [error, setError] = useState<string>('');
    const [errorType, setErrorType] = useState<ErrorType>('generic');
    const [mounted, setMounted] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Message history
    const [messages, setMessages] = useState<Message[]>([]);

    // Coach state
    const [coaches, setCoaches] = useState<Coach[]>(DEFAULT_COACHES);
    const [selectedCoach, setSelectedCoach] = useState<Coach>(DEFAULT_COACHES[0]);
    const [showCoachSelector, setShowCoachSelector] = useState(false);

    // Audio refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingStartTimeRef = useRef<number>(0);

    // Minimum recording duration in milliseconds (500ms)
    const MIN_RECORDING_DURATION = 500;

    // TTS mute state (can be toggled by user)
    const [isMuted, setIsMuted] = useState(false);

    // Transcript display state (collapsible, shows last messages)
    const [showTranscript, setShowTranscript] = useState(true);

    // Store the last accumulated response for TTS
    const lastResponseRef = useRef<string>('');

    // Abort controller for cancelling in-flight requests
    const chatAbortControllerRef = useRef<AbortController | null>(null);

    // Ensure hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load coaches from API (same pattern as ExpertChat.tsx)
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

                // Add Goal Coaches
                if (goalsData.success && goalsData.data.goals) {
                    const goalCoaches = goalsData.data.goals.map((goal: any) => ({
                        id: goal.id,
                        name: goal.title,
                        icon: getIcon(goal.domain?.icon),
                        color: goal.domain?.color || '#3b82f6',
                        description: 'Goal Coach',
                        type: 'goal' as const,
                        isGoalCoach: true
                    }));
                    newCoaches = [...newCoaches, ...goalCoaches];
                }

                // Add Custom Coaches
                if (coachesData.success && coachesData.data.coaches) {
                    const customCoaches = coachesData.data.coaches.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        icon: getIcon(c.icon),
                        color: c.color,
                        description: 'Custom Coach',
                        type: 'custom' as const,
                        systemPrompt: c.systemPrompt
                    }));
                    newCoaches = [...newCoaches, ...customCoaches];
                }

                setCoaches(newCoaches);

                // Restore previously selected coach from localStorage
                const savedCoachId = localStorage.getItem('liveVoiceCoachId');
                if (savedCoachId) {
                    const savedCoach = newCoaches.find(c => c.id === savedCoachId);
                    if (savedCoach) {
                        setSelectedCoach(savedCoach);
                    }
                }
            } catch {
                // Silently fail - use default coaches
            }
        };

        fetchCoaches();
    }, []);

    // Save selected coach to localStorage when it changes (skip initial render)
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (selectedCoach) {
            localStorage.setItem('liveVoiceCoachId', selectedCoach.id);
        }
    }, [selectedCoach]);

    // Load conversation history when coach changes (same pattern as ExpertChat.tsx)
    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
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

                    if (loadedMessages.length > 0) {
                        setMessages(loadedMessages);
                    }
                }
            } catch {
                // Silently fail - start fresh conversation
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [selectedCoach]);

    // Load TTS mute preference from localStorage
    useEffect(() => {
        const savedMuted = localStorage.getItem('liveVoiceMuted');
        if (savedMuted !== null) {
            setIsMuted(savedMuted === 'true');
        }
    }, []);

    // Save mute preference to localStorage and stop audio when muting (same pattern as ExpertChat.tsx)
    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem('liveVoiceMuted', String(newMuted));
        // Stop any currently playing audio when muting
        if (newMuted && audioRef.current) {
            audioRef.current.pause();
            if (audioRef.current.src) {
                URL.revokeObjectURL(audioRef.current.src);
            }
            audioRef.current = null;
            setOrbState('idle');
        }
    };

    // Comprehensive cleanup on unmount to prevent memory leaks (pattern from VoiceRecorder.tsx and ExpertChat.tsx)
    useEffect(() => {
        return () => {
            // Abort any in-flight chat requests
            if (chatAbortControllerRef.current) {
                chatAbortControllerRef.current.abort();
                chatAbortControllerRef.current = null;
            }

            // Stop MediaRecorder if still recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current = null;
            }

            // Clean up media stream (stop all tracks to release microphone)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            // Clear audio chunks to free memory
            audioChunksRef.current = [];

            // Clean up TTS audio playback
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src) {
                    URL.revokeObjectURL(audioRef.current.src);
                }
                audioRef.current = null;
            }
        };
    }, []);

    // Play TTS audio for a given text (same pattern as ExpertChat.tsx)
    const playTTSAudio = async (text: string) => {
        if (isMuted || !text.trim()) {
            setOrbState('idle');
            return;
        }

        // Strip any widget JSON markers from the text
        const cleanText = text.replace(/<<<\{.*?\}>>>/g, '').trim();
        if (!cleanText) {
            setOrbState('idle');
            return;
        }

        // Truncate to 4096 chars (API limit)
        const truncatedText = cleanText.length > 4096 ? cleanText.slice(0, 4096) : cleanText;

        try {
            setOrbState('speaking');

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: truncatedText })
            });

            if (!response.ok) {
                // TTS failed - fail silently, transition to idle
                setOrbState('idle');
                return;
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Stop any existing audio
            if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioRef.current.src);
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setOrbState('idle');
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            audio.onerror = () => {
                // Handle audio playback errors gracefully
                setOrbState('idle');
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            // Try to play - may be blocked by browser autoplay policy
            await audio.play().catch(() => {
                // Autoplay blocked - fail silently, transition to idle
                setOrbState('idle');
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            });

        } catch {
            // Network or other error - fail silently, transition to idle
            setOrbState('idle');
        }
    };

    // Stop TTS playback (for interruption)
    const stopTTSPlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            if (audioRef.current.src) {
                URL.revokeObjectURL(audioRef.current.src);
            }
            audioRef.current = null;
        }
        setOrbState('idle');
    };

    // Helper to set error state with type
    const setErrorWithType = (type: ErrorType, customMessage?: string) => {
        setErrorType(type);
        const { title } = getErrorMessage(type);
        setError(customMessage || title);
        setOrbState('error');
    };

    // Transcribe audio using the /api/transcribe endpoint
    const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
        setOrbState('processing');
        setError('');

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

            // Handle 'no speech detected' case - provide clear feedback
            if (!text) {
                setErrorWithType('empty_transcription');
                return null;
            }

            // Add user message to history
            const userMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'user',
                content: text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);

            // Send transcript to AI and get streaming response
            await sendMessage(text);
            return text;

        } catch (err: unknown) {
            clearTimeout(timeoutId);

            if (err instanceof Error && err.name === 'AbortError') {
                setErrorWithType('transcription_timeout');
            } else {
                setErrorWithType('transcription_failed');
            }
            return null;
        }
    };

    // Send message to AI and stream response
    const sendMessage = async (content: string): Promise<string | null> => {
        if (!content.trim()) return null;

        // Cancel any existing request
        if (chatAbortControllerRef.current) {
            chatAbortControllerRef.current.abort();
        }

        const controller = new AbortController();
        chatAbortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT);

        // Create placeholder assistant message for streaming
        const assistantMessageId = `msg-${Date.now() + 1}`;
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Reset accumulated response
        lastResponseRef.current = '';

        try {
            const response = await fetch('/api/expert/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    history: messages.slice(-10),
                    coachId: selectedCoach.id
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process SSE events from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            // Streaming complete
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                accumulatedText += parsed.text;
                                // Update assistant message with new text chunk
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: msg.content + parsed.text }
                                        : msg
                                ));
                            } else if (parsed.error) {
                                // Handle stream error
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: "I'm having trouble connecting. Please try again." }
                                        : msg
                                ));
                            }
                        } catch {
                            // Ignore parse errors for malformed chunks
                        }
                    }
                }
            }

            // Store accumulated response for TTS
            lastResponseRef.current = accumulatedText;
            chatAbortControllerRef.current = null;

            // Play TTS audio after streaming completes
            if (accumulatedText) {
                await playTTSAudio(accumulatedText);
            } else {
                setOrbState('idle');
            }

            return accumulatedText;

        } catch (err: unknown) {
            clearTimeout(timeoutId);
            chatAbortControllerRef.current = null;

            if (err instanceof Error && err.name === 'AbortError') {
                // Request was cancelled or timed out
                setErrorWithType('chat_timeout');
            } else {
                setErrorWithType('chat_failed');
            }

            // Update the assistant message with error
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: "I'm having trouble connecting. Please try again." }
                    : msg
            ));

            return null;
        }
    };

    // Start recording audio from microphone
    const startRecording = async () => {
        // Clear any previous error state
        setError('');

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
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
                streamRef.current = null;

                // Check recording duration - provide feedback if too short
                const recordingDuration = Date.now() - recordingStartTimeRef.current;
                if (recordingDuration < MIN_RECORDING_DURATION) {
                    // Recording too short - show helpful feedback instead of silently discarding
                    setErrorWithType('recording_too_short');
                    return;
                }

                // Create audio blob from chunks
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // Check if audio was captured
                if (audioBlob.size === 0) {
                    setErrorWithType('no_audio');
                    return;
                }

                // Transcribe the audio
                await transcribeAudio(audioBlob);
            };

            // Track recording start time for duration check
            recordingStartTimeRef.current = Date.now();
            mediaRecorder.start();
            setOrbState('recording');
        } catch (err) {
            // Handle specific microphone access errors with appropriate feedback
            if (err instanceof Error) {
                switch (err.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        // User denied microphone access
                        setErrorWithType('mic_denied');
                        break;
                    case 'NotFoundError':
                    case 'DevicesNotFoundError':
                        // No microphone found
                        setErrorWithType('mic_unavailable');
                        break;
                    case 'NotReadableError':
                    case 'TrackStartError':
                        // Microphone is in use by another application
                        setErrorWithType('mic_in_use');
                        break;
                    default:
                        // Generic microphone error
                        setErrorWithType('generic', 'Could not access microphone. Please check your device settings.');
                }
            } else {
                setErrorWithType('generic', 'Could not access microphone. Please check your device settings.');
            }
        }
    };

    // Stop recording audio
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            // Note: onstop handler will transition to 'processing' state
        }
    };

    // Handle orb tap
    const handleOrbTap = () => {
        if (orbState === 'idle') {
            startRecording();
        } else if (orbState === 'recording') {
            stopRecording();
        } else if (orbState === 'speaking') {
            // Interrupt TTS playback
            stopTTSPlayback();
        } else if (orbState === 'error') {
            // Retry - clear error state and return to idle
            setError('');
            setErrorType('generic');
            setOrbState('idle');
        }
    };

    // Get state indicator text - returns main text and optional hint
    const getStateText = (): { main: string; hint?: string } => {
        switch (orbState) {
            case 'idle':
                return { main: 'Tap to speak' };
            case 'recording':
                return { main: 'Listening... (tap to stop)' };
            case 'processing':
                return { main: 'Processing...' };
            case 'speaking':
                return { main: 'Coach is speaking... (tap to interrupt)' };
            case 'error': {
                const errorInfo = getErrorMessage(errorType);
                return {
                    main: error || errorInfo.title,
                    hint: errorInfo.hint + ' Tap to retry.'
                };
            }
            default:
                return { main: '' };
        }
    };

    if (!mounted) return null;

    return (
        <div className="live-voice-chat">
            {/* Back Button */}
            <Link href="/expert" className="back-button">
                <ArrowLeft size={24} />
            </Link>

            {/* Mute Toggle Button */}
            <button
                className={`mute-toggle-btn ${isMuted ? 'muted' : ''}`}
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute TTS' : 'Mute TTS'}
                title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
            >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {/* Coach Selector */}
            <div className="coach-selector-container">
                <button
                    className="coach-selector-btn"
                    onClick={() => setShowCoachSelector(!showCoachSelector)}
                >
                    <span
                        className="coach-icon"
                        style={{ background: selectedCoach.color }}
                    >
                        {selectedCoach.icon}
                    </span>
                    <span className="coach-name">{selectedCoach.name}</span>
                    <ChevronDown size={16} className={`chevron ${showCoachSelector ? 'open' : ''}`} />
                </button>

                {showCoachSelector && (
                    <div className="coach-dropdown">
                        {/* Default Coaches */}
                        <div className="dropdown-section">
                            <div className="dropdown-section-title">Coaches</div>
                            <div className="dropdown-list">
                                {coaches.filter(c => c.type === 'default').map(coach => (
                                    <button
                                        key={coach.id}
                                        className={`coach-option ${selectedCoach.id === coach.id ? 'active' : ''}`}
                                        onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}
                                    >
                                        <span className="coach-option-icon" style={{ background: coach.color }}>
                                            {coach.icon}
                                        </span>
                                        <span className="coach-option-name">{coach.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Goal Coaches */}
                        {coaches.filter(c => c.type === 'goal').length > 0 && (
                            <div className="dropdown-section">
                                <div className="dropdown-section-title">Your Goals</div>
                                <div className="dropdown-list">
                                    {coaches.filter(c => c.type === 'goal').map(coach => (
                                        <button
                                            key={coach.id}
                                            className={`coach-option ${selectedCoach.id === coach.id ? 'active' : ''}`}
                                            onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}
                                        >
                                            <span className="coach-option-icon" style={{ background: coach.color }}>
                                                {coach.icon}
                                            </span>
                                            <span className="coach-option-name">{coach.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Custom Coaches */}
                        {coaches.filter(c => c.type === 'custom').length > 0 && (
                            <div className="dropdown-section">
                                <div className="dropdown-section-title">Custom</div>
                                <div className="dropdown-list">
                                    {coaches.filter(c => c.type === 'custom').map(coach => (
                                        <button
                                            key={coach.id}
                                            className={`coach-option ${selectedCoach.id === coach.id ? 'active' : ''}`}
                                            onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}
                                        >
                                            <span className="coach-option-icon" style={{ background: coach.color }}>
                                                {coach.icon}
                                            </span>
                                            <span className="coach-option-name">{coach.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Orb Container */}
            <div className="orb-container">
                {/* The Orb */}
                <div className="orb-wrapper">
                    {/* Pulse rings for recording state */}
                    {orbState === 'recording' && (
                        <>
                            <div className="pulse-ring"></div>
                            <div className="pulse-ring delay-1"></div>
                            <div className="pulse-ring delay-2"></div>
                        </>
                    )}
                    {/* Spinning rings for processing state */}
                    {orbState === 'processing' && (
                        <>
                            <div className="processing-ring"></div>
                            <div className="processing-ring delay-1"></div>
                        </>
                    )}
                    {/* Wave rings for speaking state */}
                    {orbState === 'speaking' && (
                        <>
                            <div className="speaking-wave"></div>
                            <div className="speaking-wave delay-1"></div>
                            <div className="speaking-wave delay-2"></div>
                        </>
                    )}
                    {/* Error pulse rings */}
                    {orbState === 'error' && (
                        <>
                            <div className="error-ring"></div>
                            <div className="error-ring delay-1"></div>
                        </>
                    )}
                    <button
                        className={`orb orb-${orbState}`}
                        onClick={handleOrbTap}
                        aria-label={getStateText().main}
                    >
                        {orbState === 'processing' && (
                            <Loader2 className="orb-loader" size={48} />
                        )}
                        {orbState === 'recording' && (
                            <Mic className="orb-icon" size={48} />
                        )}
                        {orbState === 'idle' && (
                            <Mic className="orb-icon" size={48} />
                        )}
                        {orbState === 'speaking' && (
                            <Volume2 className="orb-icon" size={48} />
                        )}
                        {orbState === 'error' && (
                            <MicOff className="orb-icon" size={48} />
                        )}
                    </button>
                </div>

                {/* State Indicator */}
                <div className={`state-indicator ${orbState === 'error' ? 'error' : ''}`}>
                    <p className="state-main">{getStateText().main}</p>
                    {orbState === 'error' && getStateText().hint && (
                        <p className="state-hint">{getStateText().hint}</p>
                    )}
                </div>

                {/* Transcript Display - shows last messages */}
                {messages.length > 0 && (
                    <div className="transcript-container">
                        <button
                            className="transcript-toggle"
                            onClick={() => setShowTranscript(!showTranscript)}
                            aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'}
                        >
                            <MessageSquare size={16} />
                            <span>Transcript</span>
                            <ChevronUp size={16} className={`toggle-chevron ${showTranscript ? 'open' : ''}`} />
                        </button>
                        {showTranscript && (
                            <div className="transcript-content">
                                {messages.slice(-4).map((msg) => (
                                    <div key={msg.id} className={`transcript-message ${msg.role}`}>
                                        <span className="transcript-role">{msg.role === 'user' ? 'You' : 'Coach'}</span>
                                        <p className="transcript-text">{msg.content.length > 150 ? msg.content.slice(0, 150) + '...' : msg.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .live-voice-chat {
                    position: fixed;
                    inset: 0;
                    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    overflow: hidden;
                }

                .back-button {
                    position: absolute;
                    top: max(20px, env(safe-area-inset-top));
                    left: max(20px, env(safe-area-inset-left));
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: none;
                }

                .back-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                /* Mute Toggle Button */
                .mute-toggle-btn {
                    position: absolute;
                    top: calc(max(20px, env(safe-area-inset-top)) + 56px);
                    left: max(20px, env(safe-area-inset-left));
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .mute-toggle-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .mute-toggle-btn.muted {
                    color: rgba(255, 255, 255, 0.4);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                /* Coach Selector Styles */
                .coach-selector-container {
                    position: absolute;
                    top: max(20px, env(safe-area-inset-top));
                    right: max(20px, env(safe-area-inset-right));
                    z-index: 10;
                }

                .coach-selector-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    color: rgba(255, 255, 255, 0.9);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .coach-selector-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .coach-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }

                .coach-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .chevron {
                    opacity: 0.7;
                    transition: transform 0.2s;
                }

                .chevron.open {
                    transform: rotate(180deg);
                }

                .coach-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    background: rgba(30, 30, 50, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 16px;
                    padding: 12px;
                    min-width: 200px;
                    max-height: 60vh;
                    overflow-y: auto;
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
                    animation: slideDown 0.2s ease-out;
                    backdrop-filter: blur(12px);
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dropdown-section {
                    margin-bottom: 12px;
                }

                .dropdown-section:last-child {
                    margin-bottom: 0;
                }

                .dropdown-section-title {
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 8px;
                    padding-left: 4px;
                    letter-spacing: 0.05em;
                }

                .dropdown-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .coach-option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    border: none;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    width: 100%;
                }

                .coach-option:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .coach-option.active {
                    background: rgba(139, 92, 246, 0.3);
                    color: white;
                }

                .coach-option-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    flex-shrink: 0;
                }

                .coach-option-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .orb-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 32px;
                }

                .orb-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Pulse ring animations for recording state */
                .pulse-ring {
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    border: 3px solid rgba(239, 68, 68, 0.8);
                    animation: pulseExpand 2s ease-out infinite;
                    pointer-events: none;
                }

                .pulse-ring.delay-1 {
                    animation-delay: 0.6s;
                }

                .pulse-ring.delay-2 {
                    animation-delay: 1.2s;
                }

                @keyframes pulseExpand {
                    0% {
                        transform: scale(1);
                        opacity: 0.8;
                        border-color: rgba(249, 115, 22, 0.8);
                    }
                    50% {
                        border-color: rgba(239, 68, 68, 0.5);
                    }
                    100% {
                        transform: scale(1.8);
                        opacity: 0;
                        border-color: rgba(239, 68, 68, 0);
                    }
                }

                .orb {
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: all 0.3s ease;
                    color: white;
                }

                /* Idle state - gentle breathing pulse */
                .orb-idle {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
                    box-shadow:
                        0 0 60px rgba(139, 92, 246, 0.4),
                        0 0 120px rgba(139, 92, 246, 0.2);
                    animation: gentlePulse 3s ease-in-out infinite;
                }

                @keyframes gentlePulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow:
                            0 0 60px rgba(139, 92, 246, 0.4),
                            0 0 120px rgba(139, 92, 246, 0.2);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow:
                            0 0 80px rgba(139, 92, 246, 0.5),
                            0 0 150px rgba(139, 92, 246, 0.3);
                    }
                }

                /* Recording state - bright red/orange glow with intense animation */
                .orb-recording {
                    background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fb923c 100%);
                    box-shadow:
                        0 0 30px rgba(239, 68, 68, 0.8),
                        0 0 60px rgba(249, 115, 22, 0.6),
                        0 0 100px rgba(239, 68, 68, 0.4),
                        0 0 180px rgba(239, 68, 68, 0.2),
                        inset 0 0 40px rgba(255, 255, 255, 0.15);
                    animation: recordingPulse 1s ease-in-out infinite;
                }

                @keyframes recordingPulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow:
                            0 0 30px rgba(239, 68, 68, 0.8),
                            0 0 60px rgba(249, 115, 22, 0.6),
                            0 0 100px rgba(239, 68, 68, 0.4),
                            0 0 180px rgba(239, 68, 68, 0.2),
                            inset 0 0 40px rgba(255, 255, 255, 0.15);
                    }
                    50% {
                        transform: scale(1.06);
                        box-shadow:
                            0 0 40px rgba(239, 68, 68, 0.9),
                            0 0 80px rgba(249, 115, 22, 0.7),
                            0 0 140px rgba(239, 68, 68, 0.5),
                            0 0 220px rgba(239, 68, 68, 0.3),
                            inset 0 0 50px rgba(255, 255, 255, 0.2);
                    }
                }

                /* Processing state - spinning animation with pulsing glow */
                .orb-processing {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
                    box-shadow:
                        0 0 60px rgba(139, 92, 246, 0.5),
                        0 0 120px rgba(139, 92, 246, 0.3);
                    animation: processingPulse 2s ease-in-out infinite;
                }

                @keyframes processingPulse {
                    0%, 100% {
                        box-shadow:
                            0 0 60px rgba(139, 92, 246, 0.5),
                            0 0 120px rgba(139, 92, 246, 0.3);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow:
                            0 0 80px rgba(139, 92, 246, 0.6),
                            0 0 150px rgba(139, 92, 246, 0.4),
                            0 0 200px rgba(99, 102, 241, 0.2);
                        transform: scale(1.02);
                    }
                }

                .orb-loader {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Processing ring animations */
                .processing-ring {
                    position: absolute;
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    border: 3px solid transparent;
                    border-top-color: rgba(139, 92, 246, 0.8);
                    border-right-color: rgba(99, 102, 241, 0.4);
                    animation: processingRingSpin 1.5s linear infinite;
                    pointer-events: none;
                }

                .processing-ring.delay-1 {
                    width: 220px;
                    height: 220px;
                    border-top-color: rgba(168, 85, 247, 0.6);
                    border-right-color: rgba(139, 92, 246, 0.3);
                    animation: processingRingSpinReverse 2s linear infinite;
                }

                @keyframes processingRingSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes processingRingSpinReverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }

                /* Speaking wave animations */
                .speaking-wave {
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    border: 3px solid rgba(16, 185, 129, 0.7);
                    animation: speakingWaveExpand 1.5s ease-out infinite;
                    pointer-events: none;
                }

                .speaking-wave.delay-1 {
                    animation-delay: 0.5s;
                }

                .speaking-wave.delay-2 {
                    animation-delay: 1s;
                }

                @keyframes speakingWaveExpand {
                    0% {
                        transform: scale(1);
                        opacity: 0.8;
                        border-color: rgba(16, 185, 129, 0.8);
                    }
                    50% {
                        border-color: rgba(20, 184, 166, 0.5);
                    }
                    100% {
                        transform: scale(1.6);
                        opacity: 0;
                        border-color: rgba(6, 182, 212, 0);
                    }
                }

                /* Speaking state - wave/ripple effect */
                .orb-speaking {
                    background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%);
                    box-shadow:
                        0 0 30px rgba(16, 185, 129, 0.6),
                        0 0 60px rgba(20, 184, 166, 0.4),
                        0 0 100px rgba(16, 185, 129, 0.3),
                        0 0 160px rgba(6, 182, 212, 0.15),
                        inset 0 0 30px rgba(255, 255, 255, 0.1);
                    animation: speakingPulse 0.8s ease-in-out infinite;
                }

                @keyframes speakingPulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow:
                            0 0 30px rgba(16, 185, 129, 0.6),
                            0 0 60px rgba(20, 184, 166, 0.4),
                            0 0 100px rgba(16, 185, 129, 0.3),
                            0 0 160px rgba(6, 182, 212, 0.15),
                            inset 0 0 30px rgba(255, 255, 255, 0.1);
                    }
                    25% {
                        transform: scale(1.04);
                        box-shadow:
                            0 0 40px rgba(16, 185, 129, 0.7),
                            0 0 80px rgba(20, 184, 166, 0.5),
                            0 0 120px rgba(16, 185, 129, 0.35),
                            0 0 180px rgba(6, 182, 212, 0.2),
                            inset 0 0 40px rgba(255, 255, 255, 0.15);
                    }
                    50% {
                        transform: scale(0.97);
                        box-shadow:
                            0 0 25px rgba(16, 185, 129, 0.5),
                            0 0 50px rgba(20, 184, 166, 0.35),
                            0 0 90px rgba(16, 185, 129, 0.25),
                            0 0 140px rgba(6, 182, 212, 0.1),
                            inset 0 0 25px rgba(255, 255, 255, 0.08);
                    }
                    75% {
                        transform: scale(1.02);
                        box-shadow:
                            0 0 35px rgba(16, 185, 129, 0.65),
                            0 0 70px rgba(20, 184, 166, 0.45),
                            0 0 110px rgba(16, 185, 129, 0.3),
                            0 0 170px rgba(6, 182, 212, 0.18),
                            inset 0 0 35px rgba(255, 255, 255, 0.12);
                    }
                }

                /* Error state - red tint with shake and subtle pulse */
                .orb-error {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
                    box-shadow:
                        0 0 40px rgba(220, 38, 38, 0.6),
                        0 0 80px rgba(220, 38, 38, 0.4),
                        0 0 120px rgba(220, 38, 38, 0.2),
                        inset 0 0 30px rgba(255, 255, 255, 0.1);
                    animation: errorShake 0.5s ease-in-out, errorPulse 2s ease-in-out 0.5s infinite;
                }

                @keyframes errorShake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }

                @keyframes errorPulse {
                    0%, 100% {
                        box-shadow:
                            0 0 40px rgba(220, 38, 38, 0.6),
                            0 0 80px rgba(220, 38, 38, 0.4),
                            0 0 120px rgba(220, 38, 38, 0.2),
                            inset 0 0 30px rgba(255, 255, 255, 0.1);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow:
                            0 0 50px rgba(220, 38, 38, 0.7),
                            0 0 100px rgba(220, 38, 38, 0.5),
                            0 0 150px rgba(220, 38, 38, 0.3),
                            inset 0 0 40px rgba(255, 255, 255, 0.15);
                        transform: scale(1.03);
                    }
                }

                /* Error ring animations */
                .error-ring {
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    border: 3px solid rgba(220, 38, 38, 0.7);
                    animation: errorRingPulse 2s ease-out infinite;
                    pointer-events: none;
                }

                .error-ring.delay-1 {
                    animation-delay: 1s;
                }

                @keyframes errorRingPulse {
                    0% {
                        transform: scale(1);
                        opacity: 0.8;
                        border-color: rgba(220, 38, 38, 0.8);
                    }
                    50% {
                        border-color: rgba(185, 28, 28, 0.5);
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                        border-color: rgba(153, 27, 27, 0);
                    }
                }

                .orb-icon {
                    opacity: 0.9;
                }

                .state-indicator {
                    text-align: center;
                    max-width: 320px;
                    transition: color 0.3s ease;
                }

                .state-main {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 1rem;
                    font-weight: 500;
                    line-height: 1.4;
                    margin: 0;
                }

                .state-hint {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.85rem;
                    font-weight: 400;
                    line-height: 1.4;
                    margin: 8px 0 0 0;
                }

                .state-indicator.error .state-main {
                    color: rgba(248, 113, 113, 0.95);
                }

                .state-indicator.error .state-hint {
                    color: rgba(248, 180, 180, 0.8);
                }

                /* Transcript Display Styles */
                .transcript-container {
                    width: 100%;
                    max-width: 400px;
                    margin-top: 24px;
                }

                .transcript-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 10px 16px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px 12px 0 0;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .transcript-toggle:hover {
                    background: rgba(255, 255, 255, 0.12);
                    color: rgba(255, 255, 255, 0.8);
                }

                .toggle-chevron {
                    transition: transform 0.2s;
                }

                .toggle-chevron.open {
                    transform: rotate(180deg);
                }

                .transcript-content {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-top: none;
                    border-radius: 0 0 12px 12px;
                    padding: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                    animation: slideDown 0.2s ease-out;
                }

                .transcript-message {
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                }

                .transcript-message:last-child {
                    margin-bottom: 0;
                }

                .transcript-message.user {
                    background: rgba(139, 92, 246, 0.15);
                    border-left: 3px solid rgba(139, 92, 246, 0.6);
                }

                .transcript-message.assistant {
                    background: rgba(16, 185, 129, 0.15);
                    border-left: 3px solid rgba(16, 185, 129, 0.6);
                }

                .transcript-role {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 4px;
                    opacity: 0.7;
                }

                .transcript-message.user .transcript-role {
                    color: rgba(167, 139, 250, 0.9);
                }

                .transcript-message.assistant .transcript-role {
                    color: rgba(52, 211, 153, 0.9);
                }

                .transcript-text {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.85rem;
                    line-height: 1.4;
                    margin: 0;
                    word-break: break-word;
                }

                /* Mobile adjustments */
                @media (max-width: 640px) {
                    .orb {
                        width: 160px;
                        height: 160px;
                    }

                    .pulse-ring {
                        width: 160px;
                        height: 160px;
                    }

                    .processing-ring {
                        width: 180px;
                        height: 180px;
                    }

                    .processing-ring.delay-1 {
                        width: 200px;
                        height: 200px;
                    }

                    .speaking-wave {
                        width: 160px;
                        height: 160px;
                    }

                    .error-ring {
                        width: 160px;
                        height: 160px;
                    }

                    .back-button {
                        width: 44px;
                        height: 44px;
                    }

                    .mute-toggle-btn {
                        width: 44px;
                        height: 44px;
                        top: calc(max(20px, env(safe-area-inset-top)) + 52px);
                    }

                    .state-main {
                        font-size: 0.9rem;
                    }

                    .state-hint {
                        font-size: 0.8rem;
                    }

                    .coach-selector-btn {
                        padding: 6px 10px;
                    }

                    .coach-icon {
                        width: 24px;
                        height: 24px;
                        font-size: 0.875rem;
                    }

                    .coach-name {
                        font-size: 0.8rem;
                    }

                    .coach-dropdown {
                        min-width: 180px;
                    }

                    .transcript-container {
                        max-width: 320px;
                    }

                    .transcript-content {
                        max-height: 150px;
                    }

                    .transcript-text {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}
