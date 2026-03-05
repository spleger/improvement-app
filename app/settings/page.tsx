import Link from 'next/link';
import { redirect } from 'next/navigation';
import * as db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import SettingsForm from './SettingsForm';

async function getUserPreferences() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    const prefs = await db.getUserPreferences(user.userId);
    return prefs;
}

export default async function SettingsPage() {
    const preferences = await getUserPreferences();

    return (
        <div className="page animate-fade-in">
            <Link href="/" className="btn btn-ghost mb-lg">
                ← Back
            </Link>

            <div className="page-header">
                <h1 className="heading-2">Settings</h1>
                <p className="text-secondary">
                    Customize your transformation experience
                </p>
            </div>

            <SettingsForm initialPreferences={preferences} />
        </div>
    );
}
