'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ComboBox } from '@/components/ui/ComboBox';
import { Student } from '@/types';
import { getTodayLocalDate } from '@/lib/utils/date';

export default function SecretaryAddPaymentPage() {
  const { isSecretary, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
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

  useEffect(() => {
    if (authLoading) return;
    if (!isSecretary && !isAdmin) {
      router.replace('/dashboard');
      return;
    }
    if (isAdmin && !isSecretary) {
      // Admins use the full payments page; this page is for secretary
    }
  }, [authLoading, isSecretary, isAdmin, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getStudents();
        if (res.success && Array.isArray(res.data)) {
          setStudents(res.data as Student[]);
        }
      } catch (e) {
        console.error(e);
        setError('فشل تحميل قائمة الطلاب');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && (isSecretary || isAdmin)) {
      load();
    }
  }, [authLoading, isSecretary, isAdmin]);

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
    </div>
  );
}
