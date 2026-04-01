'use client';
import { useState, useEffect } from 'react';

interface Props {
    query: string;
}

interface ResearchResult {
    answer: string;
    citations: string[];
    query: string;
}

export default function WebResearchWidget({ query }: Props) {
    const [result, setResult] = useState<ResearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResearch = async () => {
            try {
                const res = await fetch('/api/research', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                const data = await res.json();
                if (data.success) {
                    setResult(data.data);
                } else {
                    setError(data.error || 'Research failed');
                }
            } catch (e) {
                console.error(e);
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        fetchResearch();
    }, [query]);

    if (loading) {
        return (
            <div className="card p-4 my-2 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-wider">Researching</div>
                </div>
                <div className="text-sm text-muted italic">&quot;{query}&quot;</div>
                <div className="mt-3 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-4 my-2 border-l-4 border-l-red-500">
                <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Research Failed</div>
                <div className="text-sm text-muted">{error}</div>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="card p-4 my-2 border-l-4 border-l-blue-500">
            <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-2">Research Results</div>
            <div className="text-sm text-muted italic mb-3">&quot;{result.query}&quot;</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</div>
            {result.citations && result.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted mb-1">Sources:</div>
                    <div className="flex flex-col gap-1">
                        {result.citations.slice(0, 5).map((url, i) => (
                            <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 truncate"
                            >
                                {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
