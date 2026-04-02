'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface DailyChallengeLoaderProps {
    goalId: string | null;
    goalTitle: string;
    challengesPerDay?: number;
}

export default function DailyChallengeLoader({ goalId, goalTitle, challengesPerDay = 1 }: DailyChallengeLoaderProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateChallenge = async () => {
            try {
                const response = await fetch('/api/challenges/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goalId, count: challengesPerDay })
                });

                if (!response.ok) {
                    throw new Error('Failed to generate challenge');
                }

                const data = await response.json();
                if (data.success) {
                    setIsLoading(false);
                    router.refresh();
                } else {
                    throw new Error(data.error || 'Failed to generate challenge');
                }
            } catch (err: any) {
                console.error('Error generating daily challenge:', err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        generateChallenge();
    }, [goalId, router]);

    if (error) {
        return (
            <div className="p-sm bg-surface-2 rounded-md border border-error/20 text-error text-small flex items-center gap-sm">
                <span>⚠️ Failed to create challenge for {goalTitle}</span>
                <button
                    onClick={() => window.location.reload()}
                    className="underline hover:text-error-hover"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-md bg-surface-2 rounded-md border border-border flex items-center justify-center gap-md animate-pulse">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span className="text-secondary text-small">
                {goalId ? `Creating today's challenge for ${goalTitle}...` : `Creating today's ${goalTitle}...`}
            </span>
        </div>
    );
}
