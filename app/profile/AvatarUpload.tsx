'use client';

import { useState, useRef } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
    initialUrl: string | null;
    displayName: string | null;
}

export default function AvatarUpload({ initialUrl, displayName }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUrl);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initials = (displayName || 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) return;

        // Resize and compress to fit within 512KB
        const dataUrl = await resizeImage(file, 256, 0.8);
        setAvatarUrl(dataUrl);
        await saveAvatar(dataUrl);
    };

    const resizeImage = (file: File, maxSize: number, quality: number): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const saveAvatar = async (url: string | null) => {
        setSaving(true);
        try {
            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl: url }),
            });
        } catch (err) {
            console.error('Failed to save avatar:', err);
        } finally {
            setSaving(false);
        }
    };

    const removeAvatar = async () => {
        setAvatarUrl(null);
        await saveAvatar(null);
    };

    return (
        <div className="avatar-upload">
            <div className="avatar-container" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="avatar-image" />
                ) : (
                    <div className="avatar-placeholder">🐿️</div>
                )}
                <div className="avatar-overlay">
                    {saving ? <Loader2 size={20} className="spin" /> : <Camera size={20} />}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {avatarUrl && !saving && (
                <button className="remove-btn" onClick={removeAvatar}>
                    <Trash2 size={14} />
                    Remove
                </button>
            )}

            <style jsx>{`
                .avatar-upload {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: var(--spacing-lg);
                }
                .avatar-container {
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    position: relative;
                    cursor: pointer;
                    overflow: hidden;
                }
                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: var(--gradient-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2rem;
                    font-weight: 700;
                }
                .avatar-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .avatar-container:hover .avatar-overlay,
                .avatar-container:active .avatar-overlay {
                    opacity: 1;
                }
                .remove-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    color: var(--color-error);
                    font-size: 0.8rem;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                }
                .remove-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
