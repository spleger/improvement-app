import { useState, useEffect, useRef, useCallback } from 'react';

interface VADOptions {
    stream?: MediaStream | null; // Allow passing external stream
    speechThreshold?: number;
    silenceThreshold?: number;
    startWindow?: number;
    endWindow?: number;
}

export function useVAD(options: VADOptions = {}) {
    const {
        stream,
        speechThreshold = 0.02,
        silenceThreshold = 0.01,
        startWindow = 200,
        endWindow = 1000
    } = options;

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const frameIdRef = useRef<number | null>(null);
    const internalStreamRef = useRef<MediaStream | null>(null);

    const speechStartTime = useRef<number | null>(null);
    const silenceStartTime = useRef<number | null>(null);
    const isInternallySpeaking = useRef(false);

    const startVAD = useCallback(async () => {
        try {
            let activeStream = stream;

            // If no stream provided, get one internally
            if (!activeStream) {
                activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                internalStreamRef.current = activeStream;
            }

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.4;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(activeStream);
            source.connect(analyser);
            sourceRef.current = source;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const analyze = () => {
                if (!analyserRef.current) return;

                analyserRef.current.getByteTimeDomainData(dataArray);

                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const x = (dataArray[i] - 128) / 128.0;
                    sum += x * x;
                }
                const rms = Math.sqrt(sum / bufferLength);

                setVolume(Math.min(rms * 5, 1));

                const now = Date.now();

                if (isInternallySpeaking.current) {
                    if (rms < silenceThreshold) {
                        if (!silenceStartTime.current) {
                            silenceStartTime.current = now;
                        } else if (now - silenceStartTime.current > endWindow) {
                            isInternallySpeaking.current = false;
                            setIsSpeaking(false);
                            silenceStartTime.current = null;
                        }
                    } else {
                        silenceStartTime.current = null;
                    }
                } else {
                    if (rms > speechThreshold) {
                        if (!speechStartTime.current) {
                            speechStartTime.current = now;
                        } else if (now - speechStartTime.current > startWindow) {
                            isInternallySpeaking.current = true;
                            setIsSpeaking(true);
                            speechStartTime.current = null;
                        }
                    } else {
                        speechStartTime.current = null;
                    }
                }

                frameIdRef.current = requestAnimationFrame(analyze);
            };

            analyze();

        } catch (err) {
            console.error('VAD Error:', err);
            setError('Could not access microphone');
        }
    }, [stream, speechThreshold, silenceThreshold, startWindow, endWindow]);

    const stopVAD = useCallback(() => {
        if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (internalStreamRef.current) {
            internalStreamRef.current.getTracks().forEach(track => track.stop());
            internalStreamRef.current = null;
        }

        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
        setIsSpeaking(false);
        setVolume(0);
    }, []);

    // Restart VAD if stream changes
    useEffect(() => {
        if (stream) {
            startVAD();
        }
        return () => {
            stopVAD();
        };
    }, [stream, startVAD, stopVAD]);

    return { startVAD, stopVAD, isSpeaking, volume, error };
}
