import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Paths that don't require authentication.
// Entries ending with / are prefix-matched (path and all subpaths).
// All others require an exact match.
const PUBLIC_PATHS = [
    '/login',
    '/register',
    '/onboarding/',    // prefix: /onboarding and all subpaths
    '/api/auth/',      // prefix: all auth endpoints
    '/api/onboarding/',// prefix: all onboarding API endpoints
    '/manifest.json',
    '/icons/',         // prefix: all icon assets
    '/assets/',        // prefix: all static assets
    '/.well-known/',   // prefix: TWA verification
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(p => {
        if (p.endsWith('/')) {
            // Prefix match: path equals the prefix without trailing slash,
            // or starts with the full prefix
            const prefix = p.slice(0, -1);
            return pathname === prefix || pathname.startsWith(p);
        }
        // Exact match only
        return pathname === p;
    });
}

function verifyTokenInMiddleware(token: string): boolean {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) return false;
    try {
        jwt.verify(token, secret);
        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Allow Next.js internal files
    if (path.startsWith('/_next') || path.startsWith('/static')) {
        return NextResponse.next();
    }

    // Allow public paths without authentication
    if (isPublicPath(path)) {
        return NextResponse.next();
    }

    // Protected path: require a valid JWT
    const token = request.cookies.get('auth_token')?.value;

    if (!token || !verifyTokenInMiddleware(token)) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        // Clear invalid/expired cookie to prevent redirect loops
        if (token) {
            response.cookies.delete('auth_token');
        }
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
