import { useState, useRef, useEffect, useCallback } from 'react';

interface UseTTSAudioOptions {
    storageKey: string;
    textTransform?: (text: string) => string;
}

interface UseTTSAudioReturn {
    isMuted: boolean;
    isPlayingAudio: boolean;
    toggleMute: () => void;
    playTTSAudio: (text: string) => Promise<void>;
}

export function useTTSAudio({ storageKey, textTransform }: UseTTSAudioOptions): UseTTSAudioReturn {
    const [isMuted, setIsMuted] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load mute preference from localStorage
    useEffect(() => {
        const savedMuted = localStorage.getItem(storageKey);
        if (savedMuted !== null) {
            setIsMuted(savedMuted === 'true');
        }
    }, [storageKey]);

    // Cleanup audio on unmount
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

    const toggleMute = useCallback(() => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem(storageKey, String(newMuted));
        if (newMuted && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlayingAudio(false);
        }
    }, [isMuted, storageKey]);

    const playTTSAudio = useCallback(async (text: string) => {
        if (isMuted || !text.trim()) return;

        let cleanText = textTransform ? textTransform(text) : text;
        if (!cleanText.trim()) return;

        // Truncate to 4096 chars (API limit)
        const truncatedText = cleanText.length > 4096 ? cleanText.slice(0, 4096) : cleanText;

        try {
            setIsPlayingAudio(true);

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: truncatedText })
            });

            if (!response.ok) {
                setIsPlayingAudio(false);
                return;
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

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
                setIsPlayingAudio(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            await audio.play().catch(() => {
                setIsPlayingAudio(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            });

        } catch {
            setIsPlayingAudio(false);
        }
    }, [isMuted, textTransform]);

    return { isMuted, isPlayingAudio, toggleMute, playTTSAudio };
}
