/**
 * GET /api/payments/[id] - Get payment by ID (Admin only)
 * PUT /api/payments/[id] - Update payment (Admin: any. Secretary: only payments she created)
 * DELETE /api/payments/[id] - Delete payment (Admin: any. Secretary: only payments she created)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { JWTPayload } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/utils/api-response';

function isAdminRole(role: string) {
  return role === 'admin' || role === 'subAdmin';
}

/** Admin may change any payment. Secretary may change only rows she created. */
async function assertCanMutatePayment(user: JWTPayload, paymentId: number) {
  if (!isAdminRole(user.role) && user.role !== 'secretary') {
    return forbiddenResponse('Admin access required');
  }

  const { data: existing, error } = await supabaseAdmin
    .from('payments')
    .select('id, created_by')
    .eq('id', paymentId)
    .maybeSingle();

  if (error) {
    console.error('Load payment for mutate error:', error);
    return errorResponse('Failed to load payment');
  }
  if (!existing) {
    return notFoundResponse('Payment not found');
  }
  if (user.role === 'secretary' && existing.created_by !== user.userId) {
    return forbiddenResponse('يمكنك تعديل أو حذف الدفعات التي أضفتها فقط');
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const paymentId = parseInt(params.id, 10);

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        student:students(id, full_name, parent_contact)
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return notFoundResponse('Payment not found');
    }

    return successResponse(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    return errorResponse('An error occurred while fetching payment');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse('Authentication required');
    }

    const paymentId = parseInt(params.id, 10);
    const denied = await assertCanMutatePayment(user, paymentId);
    if (denied) return denied;

    const body = await request.json();

    const updateData: any = {};
    if (body.student_id !== undefined) updateData.student_id = parseInt(body.student_id, 10);
    if (body.amount !== undefined) {
      const amountNum = parseFloat(body.amount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        return errorResponse('المبلغ يجب أن يكون أكبر من صفر');
      }
      updateData.amount = amountNum;
    }
    if (body.payment_date) updateData.payment_date = body.payment_date;
    if (body.note !== undefined) updateData.note = body.note;

    let updateQuery = supabaseAdmin
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);
    if (user.role === 'secretary') {
      updateQuery = updateQuery.eq('created_by', user.userId);
    }

    const { data: payment, error } = await updateQuery
      .select(`
        *,
        student:students(id, full_name, parent_contact)
      `)
      .single();

    if (error || !payment) {
      return errorResponse('Failed to update payment');
    }

    return successResponse(payment, 'Payment updated successfully');
  } catch (error) {
    console.error('Update payment error:', error);
    return errorResponse('An error occurred while updating payment');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse('Authentication required');
    }

    const paymentId = parseInt(params.id, 10);
    const denied = await assertCanMutatePayment(user, paymentId);
    if (denied) return denied;

    let deleteQuery = supabaseAdmin.from('payments').delete().eq('id', paymentId);
    if (user.role === 'secretary') {
      deleteQuery = deleteQuery.eq('created_by', user.userId);
    }

    const { error } = await deleteQuery;

    if (error) {
      return errorResponse('Failed to delete payment');
    }

    return successResponse({}, 'Payment deleted successfully');
  } catch (error) {
    console.error('Delete payment error:', error);
    return errorResponse('An error occurred while deleting payment');
  }
}

