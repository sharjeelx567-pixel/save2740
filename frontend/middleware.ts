import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that require authentication
const protectedPaths = [
    '/dashboard',
    '/profile',
    '/wallet',
    '/payments',
    '/admin',
    '/my-wallet',
    '/transactions',
    '/notifications',
    '/achievements',
    '/saver-pockets',
    '/settings'
]

// Define paths that are only for unauthenticated users
const authPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password'
]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if the user has a refresh token cookie
    // The backend sets this cookie as 'refreshToken'
    const hasAuthToken = request.cookies.has('refreshToken')

    // Check if the current path is a protected route
    const isProtectedPath = protectedPaths.some(path =>
        pathname.startsWith(path) || pathname === path
    )

    // Check if the current path is an auth route (login/signup)
    const isAuthPath = authPaths.some(path =>
        pathname.startsWith(path) || pathname === path
    )

    // Redirect unauthenticated users to login
    // Redirect unauthenticated users to login
    // TEMPORARY FIX: Disable middleware redirect because HttpOnly cookie is on a different domain (backend) 
    // and cannot be read by middleware on frontend domain.
    // Auth check will happen client-side in AuthContext.
    /*
    if (isProtectedPath && !hasAuthToken) {
        const url = new URL('/auth/login', request.url)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
    }
    */

    // Redirect authenticated users away from auth pages to dashboard
    // Exception: Allow access to signup page if a referral code is present (user might want to use the referral)
    if (isAuthPath && hasAuthToken) {
        const isSignupWithRef = pathname === '/auth/signup' && request.nextUrl.searchParams.has('ref')

        if (!isSignupWithRef) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Allow the request to proceed
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|js|css|woff|woff2|ttf|eot)).*)',
    ],
}
