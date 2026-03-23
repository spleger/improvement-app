'use client';

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    const confirmBackground = variant === 'danger'
        ? 'var(--color-error)'
        : 'var(--gradient-primary)';

    return (
        <div
            onClick={onCancel}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100,
                padding: '1rem',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--color-background)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    width: '100%',
                    maxWidth: '400px',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)'
                }}
            >
                <h3 className="heading-4 mb-sm">{title}</h3>
                <p className="text-secondary mb-lg" style={{ lineHeight: 1.5 }}>
                    {message}
                </p>
                <div className="flex gap-md">
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn"
                        style={{
                            flex: 1,
                            background: confirmBackground,
                            color: 'white',
                            border: 'none'
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
