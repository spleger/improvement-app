'use client';
import Link from 'next/link';

interface Props {
    title: string;
    domainId: number;
}

export default function NewGoalWidget({ title, domainId }: Props) {
    return (
        <div className="card p-4 my-2 border-l-4 border-l-primary flex justify-between items-center gap-4">
            <div>
                <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Suggestion</div>
                <h4 className="font-bold">{title}</h4>
            </div>
            <Link
                href={`/goals/new?title=${encodeURIComponent(title)}&domain=${domainId}`}
                className="btn btn-primary whitespace-nowrap"
            >
                Start Journey →
            </Link>
        </div>
    );
}
