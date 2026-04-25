/**
 * Extract user information from request headers (set by middleware).
 * If headers are missing, falls back to verifying the JWT from the Authorization header
 * (handles Edge vs Node or routes not in middleware's protected list).
 */

import { NextRequest } from 'next/server';
import { JWTPayload, verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const userId = request.headers.get('x-user-id');
  const username = request.headers.get('x-username');
  const role = request.headers.get('x-role');

  if (userId && username && role) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[getUserFromRequest] Using middleware headers, userId=', userId, 'role=', role);
    }
    return {
      userId: parseInt(userId, 10),
      username,
      role: role as JWTPayload['role'],
    };
  }

  // Fallback: verify JWT from Authorization header (middleware may not have set headers)
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[getUserFromRequest] No middleware headers and no Bearer token, url=', request.url);
    }
    return null;
  }
  try {
    const payload = verifyAccessToken(token);
    if (process.env.NODE_ENV === 'development') {
      console.log('[getUserFromRequest] Fallback JWT OK, userId=', payload.userId, 'role=', payload.role, 'url=', request.url);
    }
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[getUserFromRequest] JWT verify failed:', (err as Error)?.message, 'url=', request.url);
    }
    return null;
  }
}

