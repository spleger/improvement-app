'use client';

import { useState } from 'react';
import Link from 'next/link';
import DailySurveyForm from './DailySurveyForm';
import AIConversationPicker from './AIConversationPicker';

export default function SurveyPage() {
    const [view, setView] = useState<'checkin' | 'ai'>('checkin');

    if (view === 'ai') {
        return (
            <div className="page animate-fade-in" style={{ padding: '1rem 1.5rem' }}>
                <button
                    onClick={() => setView('checkin')}
                    className="btn btn-ghost mb-lg"
                >
                    &larr; Back to options
                </button>
                <AIConversationPicker />
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            {/* Back button */}
            <Link href="/" className="btn btn-ghost mb-lg">
                &larr; Back
            </Link>

            {/* Header */}
            <div className="page-header">
                <h1 className="heading-2">Daily Check-in</h1>
                <p className="text-secondary">
                    How are you feeling today?
                </p>
            </div>

            <DailySurveyForm />

            {/* Talk to AI option */}
            <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
                <button
                    onClick={() => setView('ai')}
                    className="btn btn-secondary w-full"
                >
                    Talk to AI instead
                </button>
            </div>
        </div>
    );
}
