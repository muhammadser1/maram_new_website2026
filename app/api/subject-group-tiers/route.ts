/**
 * GET /api/subject-group-tiers - List tiers (optional ?subject_id=)
 * POST /api/subject-group-tiers - Create/update tier (Admin)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const subjectIdParam = searchParams.get('subject_id');

    let query = supabaseAdmin
      .from('subject_group_pricing_tiers')
      .select(
        `
        *,
        subject:subjects(id, name_ar, name_en, price_per_hour, education_level_id)
      `
      )
      .order('subject_id', { ascending: true })
      .order('student_count', { ascending: true });

    if (subjectIdParam) {
      const subjectId = parseInt(subjectIdParam, 10);
      if (!Number.isNaN(subjectId)) query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query;
    if (error) return errorResponse('Failed to fetch subject group tiers');
    return successResponse(data ?? []);
  } catch (e) {
    console.error('Get subject group tiers error:', e);
    return errorResponse('An error occurred while fetching tiers');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const body = await request.json();
    const { id, subject_id, student_count, total_price, price_per_student } = body || {};

    if (!subject_id || !student_count || total_price == null) {
      return errorResponse('subject_id, student_count, and total_price are required');
    }

    const sc = parseInt(student_count, 10);
    if (Number.isNaN(sc) || sc < 2) {
      return errorResponse('student_count must be at least 2');
    }

    const tp = parseFloat(total_price);
    if (Number.isNaN(tp) || tp < 0) {
      return errorResponse('total_price must be a non-negative number');
    }

    const subId = parseInt(subject_id, 10);
    if (Number.isNaN(subId)) return errorResponse('Invalid subject_id');

    const payload = {
      subject_id: subId,
      student_count: sc,
      total_price: tp,
      price_per_student:
        price_per_student !== undefined && price_per_student !== null
          ? parseFloat(price_per_student)
          : null,
    };

    if (id) {
      const { data: updated, error } = await supabaseAdmin
        .from('subject_group_pricing_tiers')
        .update(payload)
        .eq('id', id)
        .select(
          `
          *,
          subject:subjects(id, name_ar, name_en, price_per_hour, education_level_id)
        `
        )
        .single();
      if (error) return errorResponse(error.message || 'Failed to update tier');
      return successResponse(updated, 'Tier updated');
    }

    const { data: created, error } = await supabaseAdmin
      .from('subject_group_pricing_tiers')
      .insert(payload)
      .select(
        `
        *,
        subject:subjects(id, name_ar, name_en, price_per_hour, education_level_id)
      `
      )
      .single();
    if (error) {
      if (error.code === '23505') return errorResponse('Tier for this subject and student count already exists');
      return errorResponse(error.message || 'Failed to create tier');
    }
    return successResponse(created, 'Tier created');
  } catch (e) {
    console.error('Save subject group tier error:', e);
    return errorResponse('An error occurred while saving tier');
  }
}
