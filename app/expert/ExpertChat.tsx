'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, User, Bot, ChevronDown, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import ChallengeProposal from './widgets/ChallengeProposal';
import MoodLogWidget from './widgets/MoodLogWidget';
import NewGoalWidget from './widgets/NewGoalWidget';
import CreateCoachModal from './CreateCoachModal';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

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

const DEFAULT_COACHES: Coach[] = [
    { id: 'general', name: 'General', icon: '🧠', color: '#8b5cf6', description: 'Holistic transformation', type: 'default' },
    { id: 'health', name: 'Health', icon: '💪', color: '#ef4444', description: 'Fitness & vitality', type: 'default' },
    { id: 'habits', name: 'Habits', icon: '🔄', color: '#f59e0b', description: 'Routine & consistency', type: 'default' },
    { id: 'emotional', name: 'Emotional', icon: '💜', color: '#ec4899', description: 'EQ & resilience', type: 'default' },
    { id: 'languages', name: 'Languages', icon: '🗣️', color: '#3b82f6', description: 'Fluency & immersion', type: 'default' },
    { id: 'mobility', name: 'Mobility', icon: '🧘', color: '#10b981', description: 'Movement & flexibility', type: 'default' },
];

const SUGGESTED_TOPICS = [
    "💪 I'm struggling with motivation",
    "🔄 How do I build consistency?",
    "🎯 My challenge feels too hard",
    "✨ Celebrate a recent win"
];

export default function ExpertChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Coach State
    const [coaches, setCoaches] = useState<Coach[]>(DEFAULT_COACHES);
    const [selectedCoach, setSelectedCoach] = useState<Coach>(DEFAULT_COACHES[0]);
    const [showCoachSelector, setShowCoachSelector] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Save selected coach to localStorage when it changes (skip initial render)
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (selectedCoach) {
            localStorage.setItem('selectedCoachId', selectedCoach.id);
        }
    }, [selectedCoach]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch dynamic data in parallel
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
                        id: goal.id, // Use actual Goal ID. Backend now checks this.
                        name: goal.title, // Coach Name = Goal Title
                        icon: goal.domain?.icon || '🎯',
                        color: goal.domain?.color || '#3b82f6',
                        description: 'Goal Coach',
                        type: 'goal',
                        isGoalCoach: true
                    }));
                    newCoaches = [...newCoaches, ...goalCoaches];
                }

                // Add Custom Coaches
                if (coachesData.success && coachesData.data.coaches) {
                    const customCoaches = coachesData.data.coaches.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        icon: c.icon,
                        color: c.color,
                        description: 'Custom Coach',
                        type: 'custom',
                        systemPrompt: c.systemPrompt
                    }));
                    newCoaches = [...newCoaches, ...customCoaches];
                }

                setCoaches(newCoaches);

                // Restore previously selected coach from localStorage
                const savedCoachId = localStorage.getItem('selectedCoachId');
                if (savedCoachId) {
                    const savedCoach = newCoaches.find(c => c.id === savedCoachId);
                    if (savedCoach) {
                        setSelectedCoach(savedCoach);
                    }
                }
            } catch (error) {
                console.error("Failed to load coaches/goals", error);
            }
        };

        fetchData();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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

    const handleDeleteCoach = async (e: React.MouseEvent, coachId: string) => {
        e.stopPropagation();
        if (!confirm('Delete this coach?')) return;

        try {
            await fetch(`/api/coaches?id=${coachId}`, { method: 'DELETE' });
            setCoaches(prev => prev.filter(c => c.id !== coachId));
            if (selectedCoach.id === coachId) setSelectedCoach(DEFAULT_COACHES[0]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCoach = (newCoach: any) => {
        setCoaches(prev => [...prev, {
            id: newCoach.id,
            name: newCoach.name,
            icon: newCoach.icon,
            color: newCoach.color,
            description: 'Custom AI Coach',
            type: 'custom',
            systemPrompt: newCoach.systemPrompt
        }]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // Group coaches
    const defaultCoaches = coaches.filter(c => c.type === 'default');
    const goalCoaches = coaches.filter(c => c.type === 'goal');
    const customCoaches = coaches.filter(c => c.type === 'custom');

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
                        <span className="coach-name">{selectedCoach.name} {selectedCoach.type === 'goal' ? '' : 'Coach'}</span>
                        <span className="coach-desc">{selectedCoach.description}</span>
                    </div>
                    <ChevronDown size={20} className={`chevron ${showCoachSelector ? 'open' : ''}`} />
                </button>

                {showCoachSelector && (
                    <div className="coach-dropdown custom-scrollbar">

                        {/* Default Section */}
                        <div className="dropdown-section-title">Default Coaches</div>
                        <div className="dropdown-grid">
                            {defaultCoaches.map(coach => (
                                <CoachOption
                                    key={coach.id}
                                    coach={coach}
                                    isActive={selectedCoach.id === coach.id}
                                    onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}
                                />
                            ))}
                        </div>

                        {/* Goal Section */}
                        {goalCoaches.length > 0 && (
                            <>
                                <div className="dropdown-section-title mt-2">Your Goals</div>
                                <div className="dropdown-grid">
                                    {goalCoaches.map(coach => (
                                        <CoachOption
                                            key={coach.id}
                                            coach={coach}
                                            isActive={selectedCoach.id === coach.id}
                                            onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Custom Section */}
                        <div className="dropdown-section-title" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Custom Coaches</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); setShowCoachSelector(false); }}
                                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <Plus size={12} /> Create New
                            </button>
                        </div>
                        <div className="dropdown-grid">
                            {customCoaches.map(coach => (
                                <div key={coach.id} className="relative group">
                                    <CoachOption
                                        coach={coach}
                                        isActive={selectedCoach.id === coach.id}
                                        onClick={() => { setSelectedCoach(coach); setShowCoachSelector(false); }}
                                    />
                                    <button
                                        onClick={(e) => handleDeleteCoach(e, coach.id)}
                                        style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--color-surface)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', borderRadius: '50%', padding: '4px', color: 'var(--color-error)', border: 'none', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
                                        className="group-hover-visible"
                                        title="Delete Coach"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {customCoaches.length === 0 && (
                                <div
                                    style={{ gridColumn: 'span 3', textAlign: 'center', padding: '16px', background: 'var(--color-surface-2)', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                    onClick={() => { setShowCreateModal(true); setShowCoachSelector(false); }}>
                                    + Create your first custom coach
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="chat-messages custom-scrollbar">
                {messages.length === 0 && !isLoading && (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: selectedCoach.color }}>
                            {selectedCoach.icon}
                        </div>
                        <h3>Chat with {selectedCoach.name}</h3>
                        <p>{selectedCoach.description}</p>
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
                    placeholder={`Message ${selectedCoach.name}...`}
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

            {showCreateModal && (
                <CreateCoachModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCreateCoach}
                />
            )}

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
                    position: relative;
                }

                .chat-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border);
                    background: rgba(var(--color-surface-rgb), 0.85);
                    backdrop-filter: blur(12px);
                    z-index: 20;
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
                    padding: 12px;
                    z-index: 100;
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2);
                    max-height: 400px;
                    overflow-y: auto;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dropdown-section-title {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--color-text-muted);
                    margin-bottom: 8px;
                    padding-left: 4px;
                    letter-spacing: 0.05em;
                }

                .dropdown-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 16px;
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

                .empty-state {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-muted);
                    animation: fadeIn 0.5s ease;
                }

                .empty-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 16px;
                    font-size: 3rem;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

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
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .message.assistant .message-bubble {
                    background: var(--color-surface);
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
                    padding: 8px 14px;
                    background: var(--color-surface);
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
                    background: rgba(var(--color-surface-rgb), 0.85);
                    backdrop-filter: blur(12px);
                }

                .chat-input {
                    flex: 1;
                    padding: 14px 20px;
                    background: var(--color-surface);
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
                

                .group:hover .group-hover-visible {
                    opacity: 1 !important;
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

const CoachOption = ({ coach, isActive, onClick }: { coach: Coach, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 8px',
            borderRadius: '12px',
            border: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: isActive ? 'var(--color-primary-light)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
    >
        <span style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            background: coach.color,
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            {coach.icon}
        </span>
        <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            textAlign: 'center',
            color: 'var(--color-text)',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }}>
            {coach.name}
        </span>
    </button>
);
