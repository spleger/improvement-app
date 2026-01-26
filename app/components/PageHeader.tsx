'use client';

interface PageHeaderProps {
    icon: string;
    title: string;
    subtitle?: string;
}

export default function PageHeader({ icon, title, subtitle }: PageHeaderProps) {
    return (
        <header className="page-header-styled" role="banner">
            <span className="page-header-icon" aria-hidden="true">{icon}</span>
            <h1 className="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </header>
    );
}
