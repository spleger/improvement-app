import Link from 'next/link';
import * as db from '@/lib/db';
import NewGoalForm from './NewGoalForm';

async function getGoalDomains() {
    const domains = await db.getAllGoalDomains();
    return domains;
}

export default async function NewGoalPage() {
    const domains = await getGoalDomains();

    return (
        <div className="page animate-fade-in">
            {/* Back button */}
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back
            </Link>

            {/* Header */}
            <div className="page-header">
                <h1 className="heading-2">🎯 Create Your Goal</h1>
                <p className="text-secondary">
                    What transformation do you want to make in the next 30 days?
                </p>
            </div>

            <NewGoalForm domains={domains} />
        </div>
    );
}
