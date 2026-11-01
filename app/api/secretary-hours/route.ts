/**
 * GET /api/secretary-hours - List hours (own for secretary, all for admin)
 * POST /api/secretary-hours - Create hours entry (secretary or admin on behalf)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/utils/api-response';
import { getTodayLocalDate } from '@/lib/utils/date';

function isAdminRole(role: string) {
  return role === 'admin' || role === 'subAdmin';
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }
    if (!isAdminRole(user.role) && user.role !== 'secretary') {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabaseAdmin
      .from('secretary_hours')
      .select(`
        *,
        user:users(id, username, role)
      `)
      .order('work_date', { ascending: false })
      .order('id', { ascending: false });

    if (user.role === 'secretary') {
      query = query.eq('user_id', user.userId);
    }

    if (from) query = query.gte('work_date', from);
    if (to) query = query.lte('work_date', to);

    const { data, error } = await query;
    if (error) {
      console.error('secretary_hours GET error:', error);
      return errorResponse('Failed to fetch secretary hours');
    }

    return successResponse(data || []);
  } catch (error) {
    console.error('Get secretary hours error:', error);
    return errorResponse('An error occurred while fetching secretary hours');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }
    if (!isAdminRole(user.role) && user.role !== 'secretary') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { work_date, hours, note } = body;

    const hoursNum = parseFloat(hours);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
      return errorResponse('عدد الساعات يجب أن يكون أكبر من صفر');
    }

    const { data, error } = await supabaseAdmin
      .from('secretary_hours')
      .insert({
        user_id: user.userId,
        work_date: work_date || getTodayLocalDate(),
        hours: hoursNum,
        note: note || null,
      })
      .select(`
        *,
        user:users(id, username, role)
      `)
      .single();

    if (error || !data) {
      console.error('secretary_hours POST error:', error);
      return errorResponse('Failed to create secretary hours entry');
    }

    return successResponse(data, 'Hours logged successfully');
  } catch (error) {
    console.error('Create secretary hours error:', error);
    return errorResponse('An error occurred while creating secretary hours');
  }
}
