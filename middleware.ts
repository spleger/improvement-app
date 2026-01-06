import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/manifest.json',
    '/icons',
    '/assets'
];

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if path is public
    const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));

    // Allow Next.js internal files
    if (path.startsWith('/_next') || path.startsWith('/static')) return NextResponse.next();

    // Get token
    const token = request.cookies.get('auth_token')?.value;

    // Logic:
    // 1. If user has NO token and path is protected -> Redirect to Login
    // 2. If user HAS token and tries to go to Login/Register -> Redirect to Dashboard

    if (!token && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token && (path === '/login' || path === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
