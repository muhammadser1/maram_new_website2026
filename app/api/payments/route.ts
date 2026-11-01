/**
 * GET /api/payments - Get all payments (Admin only)
 * POST /api/payments - Add new payment (Admin or Secretary)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/utils/get-user-from-request';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/utils/api-response';
import { getTodayLocalDate } from '@/lib/utils/date';

async function getStudentRemaining(studentId: number): Promise<number | null> {
  const { data, error } = await supabaseAdmin.rpc('get_student_dues_summary');
  if (error || !Array.isArray(data)) {
    console.error('get_student_dues_summary error:', error);
    return null;
  }
  const row = data.find((r: { student_id: number }) => Number(r.student_id) === studentId);
  if (!row) return 0;
  return Number(row.remaining) || 0;
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }
    if (user.role !== 'admin' && user.role !== 'subAdmin') {
      return forbiddenResponse('Admin access required');
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        student:students(id, full_name, parent_contact)
      `)
      .order('payment_date', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', parseInt(studentId, 10));
    }

    // Supabase returns max 1000 per request; paginate to get all
    const pageSize = 1000;
    const all: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: chunk, error } = await query.range(from, from + pageSize - 1);
      if (error) {
        return errorResponse('Failed to fetch payments');
      }
      const rows = chunk || [];
      all.push(...rows);
      hasMore = rows.length === pageSize;
      from += pageSize;
    }

    return successResponse(all);
  } catch (error) {
    console.error('Get payments error:', error);
    return errorResponse('An error occurred while fetching payments');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }
    const canCreate =
      user.role === 'admin' || user.role === 'subAdmin' || user.role === 'secretary';
    if (!canCreate) {
      return unauthorizedResponse('Admin or secretary access required');
    }

    const body = await request.json();
    const { student_id, amount, payment_date, note } = body;

    if (!student_id || !amount) {
      return errorResponse('Student ID and amount are required');
    }

    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return errorResponse('المبلغ يجب أن يكون أكبر من صفر');
    }

    const remaining = await getStudentRemaining(parseInt(student_id, 10));
    if (remaining === null) {
      return errorResponse('تعذر التحقق من رصيد الطالب. حاول مرة أخرى.');
    }
    if (remaining <= 0) {
      return errorResponse('لا يوجد رصيد متبقي لهذا الطالب');
    }
    if (amountNum > remaining) {
      return errorResponse(
        `المبلغ أكبر من الرصيد المتبقي (${remaining.toFixed(2)} ₪)`
      );
    }

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        student_id,
        amount: amountNum,
        payment_date: payment_date || getTodayLocalDate(),
        note: note || null,
      })
      .select()
      .single();

    if (error || !payment) {
      return errorResponse('Failed to create payment');
    }

    return successResponse(payment, 'Payment created successfully');
  } catch (error) {
    console.error('Create payment error:', error);
    return errorResponse('An error occurred while creating payment');
  }
}
