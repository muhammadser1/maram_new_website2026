/**
 * POST /api/auth/login
 * Login endpoint for admin and teachers
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { comparePassword, generateTokenPair } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { normalizeUsername } from '@/lib/utils/normalize-arabic';
import { LoginResponse, UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('Username and password are required');
    }

    // Normalize username (trim + lowercase) for consistent lookup
    const normalizedUsername = normalizeUsername(String(username));
    if (!normalizedUsername) {
      return errorResponse('Username and password are required');
    }

    // Find user: try exact match first (username stored lowercase), then case-insensitive
    type UserRow = { id: number; username: string; role: string; is_active: boolean; password_hash: string };
    let user: UserRow | null = null;
    let userError: { message: string } | null = null;

    const { data: userExact, error: errExact } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (errExact) {
      userError = errExact;
    } else if (userExact) {
      user = userExact as UserRow;
    }

    if (!user) {
      const { data: userIlike, error: errIlike } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('username', normalizedUsername)
        .maybeSingle();
      if (!userError) userError = errIlike || null;
      if (userIlike) user = userIlike as UserRow;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Login] normalizedUsername=', normalizedUsername, 'userError=', userError?.message, 'user=', user ? `id=${user.id} role=${user.role} is_active=${user.is_active}` : 'null');
    }

    if (userError || !user) {
      if (process.env.NODE_ENV === 'development' && userError) {
        console.log('[Login] No user or error:', userError.message);
      }
      return unauthorizedResponse('Invalid credentials');
    }

    if (!user.is_active) {
      if (process.env.NODE_ENV === 'development') console.log('[Login] User is inactive');
      return unauthorizedResponse('Invalid credentials');
    }

    if (!user.password_hash || typeof user.password_hash !== 'string') {
      if (process.env.NODE_ENV === 'development') console.log('[Login] User has no password_hash');
      return unauthorizedResponse('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Login] Password valid:', isPasswordValid);
    }
    if (!isPasswordValid) {
      return unauthorizedResponse('Invalid credentials');
    }

    // Get teacher info if role is teacher
    let teacher = null;
    if (user.role === 'teacher') {
      const { data: teacherData } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      teacher = teacherData;
    }

    const role = user.role as UserRole;
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      role,
    });

    const response: LoginResponse = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role,
        is_active: user.is_active,
      },
      ...(teacher && { teacher }),
    };

    return successResponse(response, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login');
  }
}

