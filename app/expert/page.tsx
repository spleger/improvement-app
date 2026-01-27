import ExpertChat from './ExpertChat';

export default function ExpertPage() {
    return (
        <div
            className="expert-page"
            style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                height: '100dvh',
                background: 'var(--color-background)',
                overflow: 'hidden'
            }}
        >
            <ExpertChat />
        </div>
    );
}
