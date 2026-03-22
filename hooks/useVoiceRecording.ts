import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecordingOptions {
    onTranscription: (text: string) => void;
}

interface UseVoiceRecordingReturn {
    isRecording: boolean;
    isTranscribing: boolean;
    handleVoiceInput: () => Promise<void>;
}

export function useVoiceRecording({ onTranscription }: UseVoiceRecordingOptions): UseVoiceRecordingReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleVoiceInput = useCallback(async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
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

                    setIsTranscribing(true);
                    try {
                        const formData = new FormData();
                        formData.append('file', audioBlob, 'recording.webm');

                        const response = await fetch('/api/transcribe', {
                            method: 'POST',
                            body: formData
                        });

                        const data = await response.json();
                        const text = data.text || data.data?.text || '';
                        if (text) {
                            onTranscription(text);
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
    }, [isRecording, onTranscription]);

    return { isRecording, isTranscribing, handleVoiceInput };
}
