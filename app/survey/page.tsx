import Link from 'next/link';
import DailySurveyForm from './DailySurveyForm';

export default function SurveyPage() {
    return (
        <div className="page animate-fade-in">
            {/* Back button */}
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back
            </Link>

            {/* Header */}
            <div className="page-header">
                <h1 className="heading-2">📝 Daily Check-in</h1>
                <p className="text-secondary">
                    How are you feeling today?
                </p>
            </div>

            <DailySurveyForm />
        </div>
    );
}
