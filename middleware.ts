/**
 * Next.js Middleware for Authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { API_ROUTES, HTTP_STATUS } from '@/lib/constants';
import { config as appConfig } from '@/lib/config';
import { JWTPayload } from '@/lib/auth';

// Routes that require authentication (middleware verifies token and sets x-user-id, x-username, x-role)
const protectedRoutes = [
  '/api/teachers',
  '/api/students',
  '/api/lessons',
  '/api/payments',
  '/api/pricing',
  '/api/statistics',
  '/api/reports',
  '/api/education-levels',
  '/api/profile',
  '/api/group-pricing-tiers',
  '/api/subject-group-tiers',
  '/api/settings',
  '/api/backup',
  '/api/subjects',
];

// Routes that require admin role
const adminRoutes = [
  '/api/teachers',
  '/api/payments',
  '/api/pricing',
  '/api/statistics',
  '/api/reports',
  '/api/group-pricing-tiers',
  '/api/subject-group-tiers',
  '/api/backup',
  // NOTE: /api/settings GET is allowed for all authenticated users (returns limited settings for teachers).
  // Admin enforcement for updates happens inside the route handler (PUT).
];

// Public routes (no authentication required)
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/reset-admin-password',
];

async function verifyTokenInMiddleware(token: string): Promise<JWTPayload> {
  if (!appConfig.jwt.secret) {
    throw new Error('JWT secret is not configured');
  }

  const secret = new TextEncoder().encode(appConfig.jwt.secret);
  const { payload } = await jwtVerify(token, secret);

  const userId = payload.userId;
  const username = payload.username;
  const role = payload.role;

  if (
    typeof userId !== 'number' ||
    typeof username !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    userId,
    username,
    role: role as JWTPayload['role'],
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      console.log('[Middleware] Protected route, no token:', pathname);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    try {
      const payload = await verifyTokenInMiddleware(token);
      console.log('[Middleware] Token OK:', pathname, 'userId=', payload.userId, 'role=', payload.role);

      // Check if route requires admin role
      const isAdminRoute = adminRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isAdminRoute && payload.role !== 'admin' && payload.role !== 'subAdmin') {
        console.log('[Middleware] Admin route, teacher denied:', pathname);
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin access required' },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId.toString());
      requestHeaders.set('x-username', payload.username);
      requestHeaders.set('x-role', payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.log('[Middleware] Token verification failed for', pathname, (error as Error)?.message || error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or expired token' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

