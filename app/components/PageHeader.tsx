'use client';

interface PageHeaderProps {
    icon: string;
    title: string;
    subtitle?: string;
}

export default function PageHeader({ icon, title, subtitle }: PageHeaderProps) {
    return (
        <div className="page-header-styled">
            <div className="page-header-icon">{icon}</div>
            <h1 className="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
    );
}
