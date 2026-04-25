/**
 * GET /api/subjects - Get all special subjects (for lesson type dropdown)
 * POST /api/subjects - Create subject (Admin only)
 * Optional query: education_level_id to filter by level
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const educationLevelId = searchParams.get('education_level_id');
    const levelId = educationLevelId ? parseInt(educationLevelId, 10) : undefined;

    let query = supabaseAdmin
      .from('subjects')
      .select('*, education_level:education_levels(id, name_ar, name_en)')
      .order('name_ar', { ascending: true });

    if (levelId != null && !Number.isNaN(levelId)) {
      // Show subjects for this level OR subjects with no level (global)
      query = query.or(`education_level_id.eq.${levelId},education_level_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse('Failed to fetch subjects');
    }

    return successResponse(data ?? []);
  } catch (error) {
    console.error('Get subjects error:', error);
    return errorResponse('An error occurred while fetching subjects');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const body = await request.json();
    const { name_ar, name_en, education_level_id, price_per_hour } = body;

    if (!name_ar || !name_ar.trim()) {
      return errorResponse('اسم المادة بالعربية مطلوب');
    }
    const price = parseFloat(price_per_hour);
    if (Number.isNaN(price) || price < 0) {
      return errorResponse('السعر لكل ساعة غير صالح');
    }

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({
        name_ar: name_ar.trim(),
        name_en: name_en?.trim() || null,
        education_level_id: education_level_id ? parseInt(education_level_id, 10) : null,
        price_per_hour: price,
      })
      .select('*, education_level:education_levels(id, name_ar, name_en)')
      .single();

    if (error) {
      return errorResponse(error.message || 'فشل إضافة المادة');
    }
    return successResponse(data, 'تمت إضافة المادة بنجاح');
  } catch (error) {
    console.error('Create subject error:', error);
    return errorResponse('حدث خطأ أثناء إضافة المادة');
  }
}
