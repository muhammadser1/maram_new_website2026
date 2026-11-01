/**
 * GET /api/secretaries - List secretary users (Admin only)
 * POST /api/secretaries - Create secretary account (Admin only)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { hashPassword } from '@/lib/auth';
import { normalizeUsername } from '@/lib/utils/normalize-arabic';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, role, is_active, created_at')
      .eq('role', 'secretary')
      .order('id', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch secretaries');
    }

    return successResponse(data || []);
  } catch (error) {
    console.error('Get secretaries error:', error);
    return errorResponse('An error occurred while fetching secretaries');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('اسم المستخدم وكلمة المرور مطلوبان');
    }

    const trimmedUsername = normalizeUsername(username);
    if (!trimmedUsername) {
      return errorResponse('اسم المستخدم مطلوب');
    }
    if (String(password).length < 4) {
      return errorResponse('كلمة المرور قصيرة جداً');
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', trimmedUsername)
      .maybeSingle();

    if (existingUser) {
      return errorResponse('اسم المستخدم مستخدم بالفعل');
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        username: trimmedUsername,
        password_hash: passwordHash,
        role: 'secretary',
        is_active: true,
      })
      .select('id, username, role, is_active, created_at')
      .single();

    if (userError || !newUser) {
      console.error('Create secretary error:', userError);
      return errorResponse('فشل إنشاء حساب السكرتيرة');
    }

    return successResponse(newUser, 'تم إنشاء حساب السكرتيرة بنجاح');
  } catch (error) {
    console.error('Create secretary error:', error);
    return errorResponse('An error occurred while creating secretary');
  }
}
