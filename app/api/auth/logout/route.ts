import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Create response that redirects to login
    const response = NextResponse.redirect(new URL('/login', request.url));

    // Clear the auth token cookie
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0 // Expire immediately
    });

    return response;
}
