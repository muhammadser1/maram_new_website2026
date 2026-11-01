'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTodayLocalDate } from '@/lib/utils/date';

interface SecretaryHoursRow {
  id: number;
  work_date: string;
  hours: number;
  note: string | null;
  created_at?: string;
}

export default function SecretaryHoursPage() {
  const { isSecretary, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<SecretaryHoursRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    work_date: getTodayLocalDate(),
    hours: '1',
    note: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getSecretaryHours();
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data as SecretaryHoursRow[]);
      }
    } catch (e) {
      console.error(e);
      setError('فشل تحميل الساعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isSecretary) {
      router.replace('/dashboard');
      return;
    }
    load();
  }, [authLoading, isSecretary, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const hoursNum = parseFloat(formData.hours);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
      setError('أدخلي عدد ساعات صحيح');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.createSecretaryHours({
        work_date: formData.work_date,
        hours: hoursNum,
        note: formData.note || undefined,
      });
      if (!res.success) {
        setError(res.error || 'فشل الحفظ');
        return;
      }
      setSuccess('تم تسجيل الساعات');
      setFormData({ work_date: getTodayLocalDate(), hours: '1', note: '' });
      await load();
    } catch (err: any) {
      setError(err?.message || 'فشل الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف هذا السجل؟')) return;
    const res = await api.deleteSecretaryHours(id);
    if (!res.success) {
      setError(res.error || 'فشل الحذف');
      return;
    }
    await load();
  };

  const totalHours = rows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

  if (authLoading || (loading && !rows.length)) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  if (!isSecretary) return null;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ساعات السكرتارية</h1>
        <p className="text-gray-600 mt-1">تسجيل ساعات العمل</p>
      </div>

      <Card title="إضافة ساعات" variant="elevated" className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="التاريخ"
            type="date"
            value={formData.work_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, work_date: e.target.value }))}
            required
          />
          <Input
            label="عدد الساعات"
            type="number"
            step="0.25"
            min="0.25"
            value={formData.hours}
            onChange={(e) => setFormData((prev) => ({ ...prev, hours: e.target.value }))}
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
            حفظ
          </Button>
        </form>
      </Card>

      <Card title={`سجلاتي (المجموع: ${totalHours.toFixed(2)} ساعة)`} variant="elevated">
        {rows.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">لا توجد ساعات مسجّلة بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-right py-2.5 px-3">التاريخ</th>
                  <th className="text-right py-2.5 px-3">الساعات</th>
                  <th className="text-right py-2.5 px-3">ملاحظة</th>
                  <th className="text-right py-2.5 px-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-200">
                    <td className="py-2 px-3">{row.work_date}</td>
                    <td className="py-2 px-3">{Number(row.hours).toFixed(2)}</td>
                    <td className="py-2 px-3">{row.note || '-'}</td>
                    <td className="py-2 px-3">
                      <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
                        حذف
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
