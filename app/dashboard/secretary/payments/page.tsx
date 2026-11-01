'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ComboBox } from '@/components/ui/ComboBox';
import { Payment, Student } from '@/types';
import { getTodayLocalDate } from '@/lib/utils/date';

const formatCurrency = (value: number) => `${Number(value).toFixed(2)} ₪`;

export default function SecretaryAddPaymentPage() {
  const { isSecretary, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_date: getTodayLocalDate(),
    note: '',
  });

  const loadHistory = useCallback(async () => {
    const res = await api.getPayments(undefined, { mine: true });
    if (res.success && Array.isArray(res.data)) {
      setHistory(res.data as Payment[]);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isSecretary && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, isSecretary, isAdmin, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [studentsRes] = await Promise.all([
          api.getStudents(),
          isSecretary ? loadHistory() : Promise.resolve(),
        ]);
        if (studentsRes.success && Array.isArray(studentsRes.data)) {
          setStudents(studentsRes.data as Student[]);
        }
      } catch (e) {
        console.error(e);
        setError('فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && (isSecretary || isAdmin)) {
      load();
    }
  }, [authLoading, isSecretary, isAdmin, loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.student_id) {
      setError('يرجى اختيار الطالب');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.createPayment({
        student_id: parseInt(formData.student_id, 10),
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date || getTodayLocalDate(),
        note: formData.note || null,
      });

      if (!response.success) {
        setError(response.error || 'فشل تسجيل الدفعة');
        return;
      }

      setSuccess('تم تسجيل الدفعة بنجاح');
      setFormData({
        student_id: '',
        amount: '',
        payment_date: getTodayLocalDate(),
        note: '',
      });
      if (isSecretary) {
        await loadHistory();
      }
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدفعة');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  if (!isSecretary && !isAdmin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إضافة دفعة</h1>
        <p className="text-gray-600 mt-1">تسجيل دفعة جديدة لطالب</p>
      </div>

      <Card title="نموذج الدفعة" variant="elevated" className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <ComboBox
            label="الطالب"
            value={formData.student_id}
            onChange={(value) => setFormData((prev) => ({ ...prev, student_id: value }))}
            options={students.map((s) => ({
              value: String(s.id),
              label: s.full_name,
            }))}
            placeholder="اختر الطالب"
            required
          />
          <Input
            label="المبلغ (₪)"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
          <Input
            label="تاريخ الدفع"
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, payment_date: e.target.value }))}
            required
          />
          <Input
            label="ملاحظة (اختياري)"
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <Button type="submit" disabled={submitting} isLoading={submitting}>
            حفظ الدفعة
          </Button>
        </form>
      </Card>

      {isSecretary && (
        <Card title={`سجل دفعاتي (${history.length})`} variant="elevated">
          <p className="text-sm text-gray-600 mb-4">
            الدفعات التي قمتِ بتسجيلها فقط (بدون عرض كل مدفوعات المعهد).
          </p>
          {history.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">لا توجد دفعات مسجّلة بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-right py-2.5 px-3">التاريخ</th>
                    <th className="text-right py-2.5 px-3">الطالب</th>
                    <th className="text-right py-2.5 px-3">المبلغ</th>
                    <th className="text-right py-2.5 px-3">ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payment) => (
                    <tr key={payment.id} className="border-t border-gray-200">
                      <td className="py-2 px-3">{payment.payment_date}</td>
                      <td className="py-2 px-3">
                        {payment.student?.full_name || `طالب ${payment.student_id}`}
                      </td>
                      <td className="py-2 px-3">{formatCurrency(payment.amount)}</td>
                      <td className="py-2 px-3">{payment.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
