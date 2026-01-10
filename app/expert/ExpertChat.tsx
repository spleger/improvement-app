'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, User, Bot, ChevronDown } from 'lucide-react';
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
    "💪 I'm struggling with motivation",
    "🔄 How do I build consistency?",
    "🎯 My challenge feels too hard",
    "✨ Celebrate a recent win"
];

const COACHES = [
    { id: 'general', name: 'General', icon: '🧠', color: '#8b5cf6', description: 'Holistic transformation' },
    { id: 'languages', name: 'Languages', icon: '🗣️', color: '#3b82f6', description: 'Fluency & immersion' },
    { id: 'mobility', name: 'Mobility', icon: '🧘', color: '#10b981', description: 'Movement & flexibility' },
    { id: 'emotional', name: 'Emotional', icon: '💜', color: '#ec4899', description: 'EQ & resilience' },
    { id: 'health', name: 'Health', icon: '💪', color: '#ef4444', description: 'Fitness & vitality' },
    { id: 'habits', name: 'Habits', icon: '🔄', color: '#f59e0b', description: 'Routine & consistency' }
];

export default function ExpertChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState(COACHES[0]);
    const [showCoachSelector, setShowCoachSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
                                <div key={index} className="my-3">
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
                                <div key={index} className="my-3">
                                    <MoodLogWidget onLog={() => scrollToBottom()} />
                                </div>
                            );
                        case 'create_goal':
                            return (
                                <div key={index} className="my-3">
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
                    return null;
                }
            }

            if (!part.trim()) return null;

            return (
                <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
                    {part}
                </span>
            );
        });
    };

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
                    content: "I understand you're working on your transformation. Could you tell me more?",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, fallbackMessage]);
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="expert-chat">
            {/* Header with Coach Selector */}
            <div className="chat-header">
                <button
                    className="coach-selector-btn"
                    onClick={() => setShowCoachSelector(!showCoachSelector)}
                >
                    <div className="coach-avatar" style={{ background: selectedCoach.color }}>
                        <span>{selectedCoach.icon}</span>
                    </div>
                    <div className="coach-info">
                        <span className="coach-name">{selectedCoach.name} Coach</span>
                        <span className="coach-desc">{selectedCoach.description}</span>
                    </div>
                    <ChevronDown size={20} className={`chevron ${showCoachSelector ? 'open' : ''}`} />
                </button>

                {showCoachSelector && (
                    <div className="coach-dropdown">
                        {COACHES.map(coach => (
                            <button
                                key={coach.id}
                                className={`coach-option ${selectedCoach.id === coach.id ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedCoach(coach);
                                    setShowCoachSelector(false);
                                }}
                            >
                                <span className="coach-option-icon" style={{ background: coach.color }}>{coach.icon}</span>
                                <span className="coach-option-name">{coach.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="chat-messages">
                {messages.length === 0 && !isLoading && (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Sparkles size={48} />
                        </div>
                        <h3>Start a Conversation</h3>
                        <p>Your {selectedCoach.name} Coach is ready to help you transform.</p>
                    </div>
                )}

                {messages.map(message => (
                    <div key={message.id} className={`message ${message.role}`}>
                        {message.role === 'assistant' && (
                            <div className="message-avatar" style={{ background: selectedCoach.color }}>
                                {selectedCoach.icon}
                            </div>
                        )}
                        <div className="message-bubble">
                            {renderMessageContent(message.content)}
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
                        <div className="message-avatar" style={{ background: selectedCoach.color }}>
                            {selectedCoach.icon}
                        </div>
                        <div className="message-bubble typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
                <div className="quick-actions">
                    {SUGGESTED_TOPICS.map((topic, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(topic)}
                            className="quick-action-btn"
                            disabled={isLoading}
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Message ${selectedCoach.name} Coach...`}
                    className="chat-input"
                    disabled={isLoading}
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
                .expert-chat {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 180px);
                    max-height: 700px;
                    background: var(--color-surface);
                    border-radius: 24px;
                    border: 1px solid var(--color-border);
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .chat-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border);
                    background: rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(10px);
                    position: relative;
                }

                .coach-selector-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 8px 12px;
                    background: var(--color-surface-2);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .coach-selector-btn:hover {
                    border-color: var(--color-primary);
                }

                .coach-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: white;
                    flex-shrink: 0;
                }

                .coach-info {
                    flex: 1;
                    text-align: left;
                }

                .coach-name {
                    display: block;
                    font-weight: 600;
                    font-size: 1rem;
                    color: var(--color-text);
                }

                .coach-desc {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                }

                .chevron {
                    color: var(--color-text-muted);
                    transition: transform 0.2s;
                }

                .chevron.open {
                    transform: rotate(180deg);
                }

                .coach-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 16px;
                    right: 16px;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    padding: 8px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    z-index: 100;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }

                .coach-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    padding: 12px 8px;
                    background: transparent;
                    border: 2px solid transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .coach-option:hover {
                    background: var(--color-surface-2);
                }

                .coach-option.active {
                    border-color: var(--color-primary);
                    background: var(--color-primary-light);
                }

                .coach-option-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                }

                .coach-option-name {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--color-text);
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .empty-state {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-muted);
                }

                .empty-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, var(--color-primary), #ec4899);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 16px;
                }

                .empty-state h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--color-text);
                    margin-bottom: 8px;
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
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                }

                .user-avatar {
                    background: var(--gradient-primary);
                    color: white;
                }

                .message-bubble {
                    max-width: 75%;
                    padding: 14px 18px;
                    border-radius: 20px;
                    line-height: 1.5;
                    font-size: 0.95rem;
                }

                .message.assistant .message-bubble {
                    background: var(--color-surface-2);
                    color: var(--color-text);
                    border-bottom-left-radius: 6px;
                }

                .message.user .message-bubble {
                    background: var(--gradient-primary);
                    color: white;
                    border-bottom-right-radius: 6px;
                }

                .message-bubble.typing {
                    display: flex;
                    gap: 4px;
                    padding: 18px 22px;
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

                .quick-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 0 20px 16px;
                }

                .quick-action-btn {
                    padding: 10px 16px;
                    background: var(--color-surface-2);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    font-size: 0.85rem;
                    color: var(--color-text);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .quick-action-btn:hover:not(:disabled) {
                    background: var(--color-primary-light);
                    border-color: var(--color-primary);
                    transform: translateY(-2px);
                }

                .quick-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .chat-input-form {
                    display: flex;
                    gap: 12px;
                    padding: 16px 20px;
                    border-top: 1px solid var(--color-border);
                    background: rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(10px);
                }

                .chat-input {
                    flex: 1;
                    padding: 14px 20px;
                    background: var(--color-surface-2);
                    border: 2px solid var(--color-border);
                    border-radius: 16px;
                    font-size: 1rem;
                    color: var(--color-text);
                    outline: none;
                    transition: border-color 0.2s;
                }

                .chat-input:focus {
                    border-color: var(--color-primary);
                }

                .chat-input::placeholder {
                    color: var(--color-text-muted);
                }

                .send-btn {
                    width: 52px;
                    height: 52px;
                    background: var(--gradient-primary);
                    border: none;
                    border-radius: 16px;
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
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                }

                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @media (max-width: 640px) {
                    .coach-dropdown {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .message-bubble {
                        max-width: 85%;
                    }
                }
            `}</style>
        </div>
    );
}
