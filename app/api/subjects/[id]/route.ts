/**
 * PUT /api/subjects/[id] - Update subject (Admin only)
 * DELETE /api/subjects/[id] - Delete subject (Admin only). Lessons using it will have subject_id set to null.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return errorResponse('Invalid subject ID');

    const body = await request.json();
    const { name_ar, name_en, education_level_id, price_per_hour } = body;

    const updates: Record<string, unknown> = {};
    if (name_ar !== undefined) updates.name_ar = name_ar.trim();
    if (name_en !== undefined) updates.name_en = name_en?.trim() || null;
    if (education_level_id !== undefined) updates.education_level_id = education_level_id ? parseInt(education_level_id, 10) : null;
    if (price_per_hour !== undefined) {
      const price = parseFloat(price_per_hour);
      if (Number.isNaN(price) || price < 0) {
        return errorResponse('السعر لكل ساعة غير صالح');
      }
      updates.price_per_hour = price;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No fields to update');
    }

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select('*, education_level:education_levels(id, name_ar, name_en)')
      .single();

    if (error) {
      return errorResponse(error.message || 'فشل تحديث المادة');
    }
    return successResponse(data, 'تم تحديث المادة بنجاح');
  } catch (error) {
    console.error('Update subject error:', error);
    return errorResponse('حدث خطأ أثناء تحديث المادة');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      return unauthorizedResponse('Admin access required');
    }

    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return errorResponse('Invalid subject ID');
    }

    const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id);

    if (error) {
      return errorResponse(error.message || 'فشل حذف المادة');
    }
    return successResponse(null, 'تم حذف المادة');
  } catch (error) {
    console.error('Delete subject error:', error);
    return errorResponse('حدث خطأ أثناء حذف المادة');
  }
}
