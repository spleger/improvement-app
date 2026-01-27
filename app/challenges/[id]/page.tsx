import Link from 'next/link';
import { notFound } from 'next/navigation';
import * as db from '@/lib/db';
import ChallengeDetailClient from './ChallengeDetailClient';

interface PageProps {
    params: { id: string };
}

export default async function ChallengeDetailPage({ params }: PageProps) {
    const challenge = await db.getChallengeById(params.id);

    if (!challenge) {
        notFound();
    }

    const isCompleted = challenge.status === 'completed';
    const isRealityShift = challenge.isRealityShift;

    // Parse scientific references if available
    let scientificRefs: string[] = [];
    if (challenge.scientificReferences) {
        try {
            scientificRefs = JSON.parse(challenge.scientificReferences);
        } catch (e) {
            // Ignore parsing errors
        }
    }

    return (
        <div className="page animate-fade-in">
            {/* Back button */}
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back to Dashboard
            </Link>

            {/* Challenge Header */}
            <div className={`challenge-card ${isRealityShift ? 'reality-shift' : ''} ${isCompleted ? 'completed' : ''} mb-lg`}>
                <div className="challenge-header">
                    <div>
                        <h1 className="challenge-title" style={{ fontSize: '1.5rem' }}>
                            {challenge.title}
                        </h1>
                        {challenge.goalTitle && (
                            <p className="text-muted text-small mt-sm">
                                Part of: {challenge.goalTitle}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-sm items-end">
                        {isRealityShift && (
                            <span className="challenge-badge challenge-badge-reality-shift">
                                ⚡ Reality Shift
                            </span>
                        )}
                        <span className="challenge-badge challenge-badge-difficulty">
                            💪 {challenge.difficulty}/10
                        </span>
                    </div>
                </div>
            </div>

            {/* Description */}
            <section className="mb-lg">
                <h2 className="heading-4 mb-md">What to do</h2>
                <div className="card">
                    <p className="text-body">{challenge.description}</p>
                </div>
            </section>

            {/* Instructions */}
            {challenge.instructions && (
                <section className="mb-lg">
                    <h2 className="heading-4 mb-md">How to do it</h2>
                    <div className="card">
                        <p className="text-body">{challenge.instructions}</p>
                    </div>
                </section>
            )}

            {/* Scientific Basis */}
            {scientificRefs.length > 0 && (
                <section className="mb-lg">
                    <h2 className="heading-4 mb-md">📚 Why this works</h2>
                    <div className="card card-surface">
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            {scientificRefs.map((ref, i) => (
                                <li key={i} className="text-secondary mb-sm">
                                    {ref}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* Success Criteria */}
            {challenge.successCriteria && (
                <section className="mb-lg">
                    <h2 className="heading-4 mb-md">✓ Success Criteria</h2>
                    <div className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                        <p className="text-body">{challenge.successCriteria}</p>
                    </div>
                </section>
            )}

            {/* Difficulty Visualization */}
            <section className="mb-lg">
                <h2 className="heading-4 mb-md">Difficulty Level</h2>
                <div className="card">
                    <div className="difficulty-bar">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className={`difficulty-bar-segment ${i < challenge.difficulty ? 'filled' : ''} ${i >= 7 && i < challenge.difficulty ? 'high' : ''}`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-muted text-small mt-md">
                        {challenge.difficulty <= 3 && 'Gentle start'}
                        {challenge.difficulty > 3 && challenge.difficulty <= 5 && 'Moderate challenge'}
                        {challenge.difficulty > 5 && challenge.difficulty <= 7 && 'Pushing boundaries'}
                        {challenge.difficulty > 7 && challenge.difficulty <= 9 && 'Seriously challenging'}
                        {challenge.difficulty === 10 && 'Maximum intensity'}
                    </p>
                </div>
            </section>

            {/* Actions */}
            <ChallengeDetailClient
                challengeId={challenge.id}
                isCompleted={isCompleted}
                challenge={{
                    title: challenge.title,
                    description: challenge.description,
                    difficulty: challenge.difficulty,
                    personalizationNotes: challenge.personalizationNotes || challenge.instructions || undefined
                }}
            />
        </div>
    );
}
