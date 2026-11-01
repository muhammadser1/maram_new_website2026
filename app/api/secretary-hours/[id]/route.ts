/**
 * DELETE /api/secretary-hours/[id]
 * Secretary: own entries only. Admin: any.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/utils/api-response';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }
    const isAdmin = user.role === 'admin' || user.role === 'subAdmin';
    if (!isAdmin && user.role !== 'secretary') {
      return forbiddenResponse();
    }

    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return errorResponse('Invalid id');
    }

    const { data: existing, error: findError } = await supabaseAdmin
      .from('secretary_hours')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError || !existing) {
      return notFoundResponse('Entry not found');
    }

    if (!isAdmin && existing.user_id !== user.userId) {
      return forbiddenResponse('يمكنك حذف سجلاتك فقط');
    }

    const { error } = await supabaseAdmin.from('secretary_hours').delete().eq('id', id);
    if (error) {
      return errorResponse('Failed to delete entry');
    }

    return successResponse({}, 'Deleted successfully');
  } catch (error) {
    console.error('Delete secretary hours error:', error);
    return errorResponse('An error occurred while deleting secretary hours');
  }
}
