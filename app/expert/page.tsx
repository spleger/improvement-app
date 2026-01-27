import ExpertChat from './ExpertChat';

export default function ExpertPage() {
    return (
        <div
            className="expert-page"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100vh',
                // @ts-expect-error: CSS custom property for dvh fallback
                height: '100dvh',
                background: 'var(--color-background)',
                overflow: 'hidden',
                touchAction: 'none',
                overscrollBehavior: 'none',
            }}
        >
            <ExpertChat />
        </div>
    );
}
