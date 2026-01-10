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
    '/assets'
];

export async function middleware(request: NextRequest) {
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
    // 3. If user HAS token but hasn't completed onboarding -> Redirect to Onboarding

    if (!token && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token && (path === '/login' || path === '/register')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Check onboarding status (we'll need to decode token or make an API call)
    // For now, we'll handle this on the client side in each protected page

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
