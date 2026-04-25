/**
 * POST /api/auth/reset-admin-password
 * One-time reset for admin password using the app's own hashing (fixes login when script hash doesn't match).
 * In development: POST { "username": "admin", "newPassword": "admin" }
 * In production: set RESET_ADMIN_SECRET in env and POST { "secret": "<that>", "username": "admin", "newPassword": "..." }
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, newPassword, secret } = body;

    const isDev = process.env.NODE_ENV === 'development';
    const resetSecret = process.env.RESET_ADMIN_SECRET;

    if (!isDev && (!resetSecret || secret !== resetSecret)) {
      return errorResponse('Forbidden', 403);
    }

    const targetUsername = (username || 'admin').toString().trim().toLowerCase();
    if (!targetUsername || !newPassword || typeof newPassword !== 'string') {
      return errorResponse('username and newPassword are required');
    }
    if (newPassword.length < 4) {
      return errorResponse('newPassword must be at least 4 characters');
    }

    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .ilike('username', targetUsername)
      .maybeSingle();

    if (findError || !user) {
      return errorResponse('User not found');
    }

    const passwordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      return errorResponse('Failed to update password');
    }

    return successResponse(
      { message: 'Password updated. You can now log in with username: ' + targetUsername },
      'Password updated'
    );
  } catch (e) {
    return errorResponse('An error occurred');
  }
}
