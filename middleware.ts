import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = [
    '/login',
    '/register',
    '/onboarding', // Allow access to onboarding
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/demo',
    '/api/onboarding', // Allow onboarding API calls
    '/manifest.json',
    '/icons',
    '/assets',
    '/.well-known' // Allow TWA verification
];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if path is public
    const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));

    // Allow Next.js internal files
    if (path.startsWith('/_next') || path.startsWith('/static')) return NextResponse.next();

    const token = request.cookies.get('auth_token')?.value;

    // Logic:
    // 1. If user has NO token and path is protected -> Redirect to Login
    // 2. If user HAS token and tries to go to Login/Register -> Redirect to Dashboard
    // 3. Allow all other cases

    if (!token && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
