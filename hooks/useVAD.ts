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
    const [isCalibrating, setIsCalibrating] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const frameIdRef = useRef<number | null>(null);
    const internalStreamRef = useRef<MediaStream | null>(null);

    const speechStartTime = useRef<number | null>(null);
    const silenceStartTime = useRef<number | null>(null);
    const isInternallySpeaking = useRef(false);

    // Adaptive calibration refs
    const calibratingRef = useRef(true);
    const calibrationStartRef = useRef<number>(0);
    const calibrationSamplesRef = useRef<number[]>([]);
    const effectiveSpeechThresholdRef = useRef(speechThreshold);
    const effectiveSilenceThresholdRef = useRef(silenceThreshold);

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

            // Initialize calibration state
            calibratingRef.current = true;
            calibrationStartRef.current = 0;
            calibrationSamplesRef.current = [];
            effectiveSpeechThresholdRef.current = speechThreshold;
            effectiveSilenceThresholdRef.current = silenceThreshold;
            setIsCalibrating(true);

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

                // Calibration phase: collect RMS samples for the first 2000ms
                if (calibratingRef.current) {
                    if (calibrationStartRef.current === 0) {
                        calibrationStartRef.current = now;
                    }

                    calibrationSamplesRef.current.push(rms);

                    if (now - calibrationStartRef.current >= 2000) {
                        // Compute noise floor as mean of samples
                        const samples = calibrationSamplesRef.current;
                        const noiseFloor = samples.reduce((a, b) => a + b, 0) / samples.length;

                        effectiveSpeechThresholdRef.current = Math.min(Math.max(noiseFloor * 3, 0.015), 0.1);
                        effectiveSilenceThresholdRef.current = Math.max(noiseFloor * 1.5, 0.008);

                        calibratingRef.current = false;
                        setIsCalibrating(false);
                    }

                    frameIdRef.current = requestAnimationFrame(analyze);
                    return;
                }

                // Normal VAD phase using effective thresholds
                if (isInternallySpeaking.current) {
                    if (rms < effectiveSilenceThresholdRef.current) {
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
                    if (rms > effectiveSpeechThresholdRef.current) {
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

        // Reset calibration refs
        calibratingRef.current = true;
        calibrationStartRef.current = 0;
        calibrationSamplesRef.current = [];
        effectiveSpeechThresholdRef.current = speechThreshold;
        effectiveSilenceThresholdRef.current = silenceThreshold;
        setIsCalibrating(false);

        setIsSpeaking(false);
        setVolume(0);
    }, [speechThreshold, silenceThreshold]);

    // Restart VAD if stream changes
    useEffect(() => {
        if (stream) {
            startVAD();
        }
        return () => {
            stopVAD();
        };
    }, [stream, startVAD, stopVAD]);

    return { startVAD, stopVAD, isSpeaking, volume, error, isCalibrating };
}
