export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#121212',
            color: '#f0f0f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Page Not Found
            </h2>
            <p style={{ color: '#a0a0b0', marginBottom: '2rem', maxWidth: '300px' }}>
                The page you are looking for does not exist.
            </p>
            <a
                href="/"
                style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                }}
            >
                Go Home
            </a>
        </div>
    );
}
