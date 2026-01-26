'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, VolumeX, User, MessageCircle } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Interview stages following the spec framework
export type InterviewStage = 'mood' | 'goals' | 'challenges' | 'habits' | 'general' | 'open';

const INTERVIEW_STAGES: { id: InterviewStage; label: string; icon: string }[] = [
    { id: 'mood', label: 'Mood', icon: '😊' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'challenges', label: 'Challenges', icon: '💪' },
    { id: 'habits', label: 'Habits', icon: '🔄' },
    { id: 'general', label: 'Growth', icon: '🌱' },
    { id: 'open', label: 'Open', icon: '💬' },
];

interface InterviewChatProps {
    initialStage?: InterviewStage;
    onStageChange?: (stage: InterviewStage) => void;
}

export default function InterviewChat({ initialStage = 'mood', onStageChange }: InterviewChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentStage, setCurrentStage] = useState<InterviewStage>(initialStage);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // TTS Audio State
    const [isMuted, setIsMuted] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load TTS mute preference from localStorage
    useEffect(() => {
        const savedMuted = localStorage.getItem('interviewChatMuted');
        if (savedMuted !== null) {
            setIsMuted(savedMuted === 'true');
        }
    }, []);

    // Cleanup audio on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src) {
                    URL.revokeObjectURL(audioRef.current.src);
                }
                audioRef.current = null;
            }
        };
    }, []);

    // Notify parent of stage changes
    useEffect(() => {
        onStageChange?.(currentStage);
    }, [currentStage, onStageChange]);

    // Save mute preference to localStorage
    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem('interviewChatMuted', String(newMuted));
        // Stop any currently playing audio when muting
        if (newMuted && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlayingAudio(false);
        }
    };

    // Play TTS audio for a given text
    const playTTSAudio = async (text: string) => {
        if (isMuted || !text.trim()) return;

        // Truncate to 4096 chars (API limit)
        const truncatedText = text.length > 4096 ? text.slice(0, 4096) : text;

        try {
            setIsPlayingAudio(true);

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: truncatedText })
            });

            if (!response.ok) {
                // TTS failed - fail silently as per spec (fall back to text-only)
                setIsPlayingAudio(false);
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
                setIsPlayingAudio(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            audio.onerror = () => {
                // Handle audio playback errors gracefully (e.g., autoplay blocked)
                setIsPlayingAudio(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            // Try to play - may be blocked by browser autoplay policy
            await audio.play().catch(() => {
                // Autoplay blocked - fail silently
                setIsPlayingAudio(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            });

        } catch {
            // Network or other error - fail silently
            setIsPlayingAudio(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Only auto-scroll when not streaming (user controls scroll during streaming)
        if (!isStreaming) {
            scrollToBottom();
        }
    }, [messages, isStreaming]);

    // Start interview with initial greeting when component mounts
    useEffect(() => {
        const startInterview = async () => {
            setIsLoading(true);

            // Create placeholder assistant message for streaming
            const assistantMessageId = Date.now().toString();
            const assistantMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };
            setMessages([assistantMessage]);

            try {
                const response = await fetch('/api/interview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: '__START_INTERVIEW__',
                        stage: currentStage,
                        history: []
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('No response body');
                }

                setIsLoading(false);
                setIsStreaming(true);

                const decoder = new TextDecoder();
                let buffer = '';
                let accumulatedText = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Process SSE events from buffer
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.text) {
                                    accumulatedText += parsed.text;
                                    setMessages(prev => prev.map(msg =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: msg.content + parsed.text }
                                            : msg
                                    ));
                                } else if (parsed.stage) {
                                    // Update stage if AI signals transition
                                    setCurrentStage(parsed.stage);
                                } else if (parsed.error) {
                                    setMessages(prev => prev.map(msg =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: "I'm having trouble starting. Please try again." }
                                            : msg
                                    ));
                                }
                            } catch {
                                // Ignore parse errors for malformed chunks
                            }
                        }
                    }
                }

                // Play TTS audio after streaming completes
                if (accumulatedText) {
                    playTTSAudio(accumulatedText);
                }
            } catch {
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                        ? { ...msg, content: "I'm having trouble connecting. Please refresh and try again." }
                        : msg
                ));
            } finally {
                setIsLoading(false);
                setIsStreaming(false);
            }
        };

        startInterview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Create placeholder assistant message for streaming
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const response = await fetch('/api/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    stage: currentStage,
                    history: messages.slice(-10)
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            setIsLoading(false);
            setIsStreaming(true);

            const decoder = new TextDecoder();
            let buffer = '';
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process SSE events from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                accumulatedText += parsed.text;
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: msg.content + parsed.text }
                                        : msg
                                ));
                            } else if (parsed.stage) {
                                // Update stage if AI signals transition
                                setCurrentStage(parsed.stage);
                            } else if (parsed.error) {
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

            // Play TTS audio after streaming completes
            if (accumulatedText) {
                playTTSAudio(accumulatedText);
            }
        } catch {
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: "I'm having trouble connecting. Please try again." }
                    : msg
            ));
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // Voice Recording Functions
    const handleVoiceInput = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    stream.getTracks().forEach(track => track.stop());
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                    // Transcribe the audio
                    setIsTranscribing(true);
                    try {
                        const formData = new FormData();
                        formData.append('audio', audioBlob, 'recording.webm');

                        const response = await fetch('/api/transcribe', {
                            method: 'POST',
                            body: formData
                        });

                        const data = await response.json();
                        if (data.success && data.data.text) {
                            setInput(prev => prev + (prev ? ' ' : '') + data.data.text);
                            inputRef.current?.focus();
                        }
                    } catch {
                        // Transcription failed - silently ignore
                    } finally {
                        setIsTranscribing(false);
                    }
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch {
                // Microphone access denied - silently ignore
            }
        }
    };

    // Get current stage index for progress indicator
    const currentStageIndex = INTERVIEW_STAGES.findIndex(s => s.id === currentStage);

    return (
        <div className="interview-chat">
            {/* Progress Indicator */}
            <div className="interview-header">
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentStageIndex + 1) / INTERVIEW_STAGES.length) * 100}%` }}
                        />
                    </div>
                    <div className="stage-indicators">
                        {INTERVIEW_STAGES.map((stage, index) => (
                            <div
                                key={stage.id}
                                className={`stage-dot ${index <= currentStageIndex ? 'active' : ''} ${index === currentStageIndex ? 'current' : ''}`}
                                title={stage.label}
                            >
                                <span className="stage-icon">{stage.icon}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="header-controls">
                    <span className="current-stage-label">
                        {INTERVIEW_STAGES[currentStageIndex]?.label || 'Interview'}
                    </span>
                    <button
                        type="button"
                        onClick={toggleMute}
                        className={`audio-toggle-btn ${isMuted ? 'muted' : ''} ${isPlayingAudio ? 'playing' : ''}`}
                        title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages custom-scrollbar">
                {messages.map(message => (
                    <div key={message.id} className={`message ${message.role}`}>
                        {message.role === 'assistant' && (
                            <div className="message-avatar assistant-avatar">
                                <MessageCircle size={16} />
                            </div>
                        )}
                        <div className="message-bubble">
                            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
                        </div>
                        {message.role === 'user' && (
                            <div className="message-avatar user-avatar">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="message assistant">
                        <div className="message-avatar assistant-avatar">
                            <MessageCircle size={16} />
                        </div>
                        <div className="message-bubble typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="chat-input-form">
                <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`mic-btn ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
                    disabled={isLoading || isTranscribing}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                >
                    <Mic size={20} />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={isTranscribing ? 'Transcribing...' : 'Type or speak your response...'}
                    className="chat-input"
                    disabled={isLoading || isTranscribing}
                />
                <button
                    type="submit"
                    className="send-btn"
                    disabled={isLoading || !input.trim()}
                >
                    <Send size={20} />
                </button>
            </form>

            <style jsx>{`
                .interview-chat {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 250px);
                    min-height: 400px;
                    max-height: 550px;
                    background: var(--color-surface);
                    border-radius: 24px;
                    border: 1px solid var(--color-border);
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .interview-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border);
                    background: rgba(var(--color-surface-rgb), 0.85);
                    backdrop-filter: blur(12px);
                }

                .progress-container {
                    margin-bottom: 12px;
                }

                .progress-bar {
                    height: 4px;
                    background: var(--color-border);
                    border-radius: 2px;
                    margin-bottom: 12px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #8b5cf6, #6366f1);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .stage-indicators {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 4px;
                }

                .stage-dot {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-surface-2);
                    border: 2px solid var(--color-border);
                    transition: all 0.2s;
                }

                .stage-dot.active {
                    border-color: #8b5cf6;
                    background: rgba(139, 92, 246, 0.1);
                }

                .stage-dot.current {
                    border-color: #8b5cf6;
                    background: #8b5cf6;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
                }

                .stage-icon {
                    font-size: 0.9rem;
                }

                .stage-dot.current .stage-icon {
                    filter: brightness(1.2);
                }

                .header-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .current-stage-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #8b5cf6;
                }

                .audio-toggle-btn {
                    width: 36px;
                    height: 36px;
                    background: var(--color-surface-2);
                    border: 1px solid var(--color-border);
                    border-radius: 10px;
                    color: var(--color-text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .audio-toggle-btn:hover {
                    color: #8b5cf6;
                    border-color: #8b5cf6;
                }

                .audio-toggle-btn.muted {
                    opacity: 0.6;
                }

                .audio-toggle-btn.playing {
                    color: #8b5cf6;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    background-image: radial-gradient(var(--color-surface-2) 1px, transparent 1px);
                    background-size: 20px 20px;
                }

                .message {
                    display: flex;
                    gap: 12px;
                    align-items: flex-end;
                    animation: slideIn 0.3s ease;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .message.user {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .assistant-avatar {
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    color: white;
                }

                .user-avatar {
                    background: var(--gradient-primary);
                    color: white;
                }

                .message-bubble {
                    max-width: 75%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    line-height: 1.5;
                    font-size: 0.9rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .message.assistant .message-bubble {
                    background: var(--color-surface);
                    color: var(--color-text);
                    border: 1px solid var(--color-border);
                    border-bottom-left-radius: 6px;
                }

                .message.user .message-bubble {
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    color: white;
                    border-bottom-right-radius: 6px;
                }

                .message-bubble.typing {
                    display: flex;
                    gap: 4px;
                    padding: 16px 20px;
                }

                .message-bubble.typing span {
                    width: 8px;
                    height: 8px;
                    background: var(--color-text-muted);
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out;
                }

                .message-bubble.typing span:nth-child(1) { animation-delay: -0.32s; }
                .message-bubble.typing span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }

                .chat-input-form {
                    display: flex;
                    gap: 12px;
                    padding: 16px 20px;
                    border-top: 1px solid var(--color-border);
                    background: rgba(var(--color-surface-rgb), 0.85);
                    backdrop-filter: blur(12px);
                }

                .chat-input {
                    flex: 1;
                    padding: 12px 18px;
                    background: var(--color-surface);
                    border: 2px solid var(--color-border);
                    border-radius: 14px;
                    font-size: 0.95rem;
                    color: var(--color-text);
                    outline: none;
                    transition: border-color 0.2s;
                }

                .chat-input:focus {
                    border-color: #8b5cf6;
                }

                .chat-input::placeholder {
                    color: var(--color-text-muted);
                }

                .send-btn {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    border: none;
                    border-radius: 14px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                }

                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .mic-btn {
                    width: 40px;
                    height: 40px;
                    background: transparent;
                    border: none;
                    border-radius: 10px;
                    color: var(--color-text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .mic-btn:hover:not(:disabled) {
                    color: #8b5cf6;
                    background: var(--color-surface-2);
                }

                .mic-btn.recording {
                    color: #ef4444;
                    animation: pulse 1s infinite;
                }

                .mic-btn.transcribing {
                    color: #8b5cf6;
                    opacity: 0.6;
                }

                .mic-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 3px;
                }

                @media (max-width: 640px) {
                    .interview-chat {
                        height: calc(100vh - 200px);
                        max-height: none;
                    }

                    .message-bubble {
                        max-width: 85%;
                    }

                    .stage-dot {
                        width: 28px;
                        height: 28px;
                    }

                    .stage-icon {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}
