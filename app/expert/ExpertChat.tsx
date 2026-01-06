'use client';

import { useState, useRef, useEffect } from 'react';
import ChallengeProposal from './widgets/ChallengeProposal';
import MoodLogWidget from './widgets/MoodLogWidget';
import NewGoalWidget from './widgets/NewGoalWidget';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTED_TOPICS = [
    "I'm struggling with motivation",
    "How do I build consistency?",
    "My challenge feels too hard",
    "I want to adjust my goal"
];

const COACHES = [
    { id: 'general', name: 'General Coach', icon: '🧠', description: 'Holistic transformation support' },
    { id: 'languages', name: 'Language Coach', icon: '🗣️', description: 'Fluency & immersion' },
    { id: 'mobility', name: 'Mobility Coach', icon: '🧘', description: 'Movement & flexibility' },
    { id: 'emotional', name: 'Emotional Coach', icon: '💜', description: 'EQ & resilience' },
    { id: 'relationships', name: 'Relationship Coach', icon: '🤝', description: 'Connection & communication' },
    { id: 'health', name: 'Health Coach', icon: '💪', description: 'Fitness & vitality' },
    { id: 'tolerance', name: 'Tolerance Coach', icon: '🛡️', description: 'Discomfort & resilience' },
    { id: 'skills', name: 'Skills Coach', icon: '🎯', description: 'Mastery & practice' },
    { id: 'habits', name: 'Habit Coach', icon: '🔄', description: 'Routine & consistency' }
];

export default function ExpertChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState(COACHES[0]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Render helper for widgets
    const renderMessageContent = (content: string) => {
        const parts = content.split(/(<<<\{.*?\}>>>)/g);

        return parts.map((part, index) => {
            if (part.startsWith('<<<') && part.endsWith('>>>')) {
                try {
                    const jsonStr = part.slice(3, -3);
                    const data = JSON.parse(jsonStr);

                    switch (data.type) {
                        case 'suggest_challenge':
                            return (
                                <div key={index} className="my-2">
                                    <ChallengeProposal
                                        title={data.payload.title}
                                        difficulty={data.payload.difficulty}
                                        isRealityShift={data.payload.isRealityShift}
                                        onAccept={() => scrollToBottom()}
                                    />
                                </div>
                            );
                        case 'log_mood':
                            return (
                                <div key={index} className="my-2">
                                    <MoodLogWidget onLog={() => scrollToBottom()} />
                                </div>
                            );
                        case 'create_goal':
                            return (
                                <div key={index} className="my-2">
                                    <NewGoalWidget
                                        title={data.payload.title}
                                        domainId={data.payload.domainId}
                                    />
                                </div>
                            );
                        default:
                            return null;
                    }
                } catch (e) {
                    console.error('Failed to parse widget', e);
                    return null;
                }
            }

            if (!part.trim()) return null;

            return (
                <p key={index} style={{ margin: 0, whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>
                    {part}
                </p>
            );
        });
    };

    // Helper to generate diff IDs for history items
    const diffId = (idx: number) => `hist-${Date.now()}-${idx}`;

    // Load history when coach changes
    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
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
            } catch (e) {
                console.error("Failed to load history", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [selectedCoach]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

        try {
            const response = await fetch('/api/expert/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    history: messages.slice(-10),
                    coachId: selectedCoach.id
                })
            });

            const data = await response.json();

            if (data.success && data.data.reply) {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.data.reply,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const fallbackMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "I understand you're working on your transformation. Could you tell me more about what specific aspect you'd like help with?",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, fallbackMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="chat-container">
            {/* Coach Selector */}
            <div className="coach-selector mb-md">
                <div className="flex gap-sm" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {COACHES.map(coach => (
                        <button
                            key={coach.id}
                            onClick={() => setSelectedCoach(coach)}
                            className={`coach-chip ${selectedCoach.id === coach.id ? 'active' : ''}`}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{coach.icon}</span>
                            <span className="text-small font-medium">{coach.name}</span>
                        </button>
                    ))}
                </div>
                <p className="text-tiny text-center text-muted mt-xs">
                    {selectedCoach.description}
                </p>
            </div>

            {/* Messages */}
            <div className="chat-messages" style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`chat-message ${message.role}`}
                        style={{
                            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '0.75rem 1rem',
                            borderRadius: message.role === 'user'
                                ? '1rem 1rem 0.25rem 1rem'
                                : '1rem 1rem 1rem 0.25rem',
                            background: message.role === 'user'
                                ? 'var(--gradient-primary)'
                                : 'var(--color-surface)',
                            color: message.role === 'user' ? 'white' : 'inherit'
                        }}
                    >
                        {message.role === 'assistant' && (
                            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                                {selectedCoach.icon}
                            </div>
                        )}
                        <div>{renderMessageContent(message.content)}</div>
                    </div>
                ))}

                {isLoading && (
                    <div
                        className="chat-message assistant"
                        style={{
                            alignSelf: 'flex-start',
                            padding: '0.75rem 1rem',
                            borderRadius: '1rem 1rem 1rem 0.25rem',
                            background: 'var(--color-surface)'
                        }}
                    >
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Topics */}
            {messages.length <= 2 && (
                <div style={{ marginBottom: '1rem' }}>
                    <div className="text-small text-muted mb-sm">Suggested topics:</div>
                    <div className="flex flex-wrap gap-sm">
                        {SUGGESTED_TOPICS.map((topic, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(topic)}
                                className="btn btn-ghost"
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                                disabled={isLoading}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="chat-input-container">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Ask the ${selectedCoach.name}...`}
                    className="form-input"
                    style={{ flex: 1 }}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || !input.trim()}
                >
                    Send
                </button>
            </form>

            <style jsx>{`
        .coach-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--color-surface);
          border: 1px solid transparent;
          border-radius: 2rem;
          white-space: nowrap;
          transition: all 0.2s;
          opacity: 0.7;
          cursor: pointer;
        }
        .coach-chip:hover {
          opacity: 1;
          transform: translateY(-1px);
        }
        .coach-chip.active {
          opacity: 1;
          background: var(--gradient-primary);
          color: white;
          box-shadow: var(--shadow-sm);
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: var(--color-text-muted);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .chat-input-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
      `}</style>
        </div>
    );
}
