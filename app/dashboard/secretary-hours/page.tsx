'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date';

interface SecretaryHoursRow {
  id: number;
  user_id: number;
  work_date: string;
  hours: number;
  note: string | null;
  user?: { id: number; username: string; role: string } | null;
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function AdminSecretaryHoursPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [rows, setRows] = useState<SecretaryHoursRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const y = Number(year);
        const m = Number(month);
        const res = await api.getSecretaryHours({
          from: getFirstDayOfMonth(y, m),
          to: getLastDayOfMonth(y, m),
        });
        if (res.success && Array.isArray(res.data)) {
          setRows(res.data as SecretaryHoursRow[]);
        } else {
          setError(res.error || 'فشل التحميل');
          setRows([]);
        }
      } catch (e) {
        console.error(e);
        setError('فشل التحميل');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, year, month]);

  const totalHours = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0),
    [rows]
  );

  const handleDelete = async (id: number) => {
    if (!confirm('حذف هذا السجل؟')) return;
    const res = await api.deleteSecretaryHours(id);
    if (!res.success) {
      setError(res.error || 'فشل الحذف');
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  if (authLoading) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ساعات السكرتارية</h1>
        <p className="text-gray-600 mt-1">متابعة ساعات عمل السكرتيرة</p>
      </div>

      <Card title="تصفية حسب الشهر" variant="elevated">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="السنة"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
            className="w-32"
          />
          <Select
            label="الشهر"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={monthNames.map((name, index) => ({
              value: String(index + 1).padStart(2, '0'),
              label: name,
            }))}
            className="w-40"
          />
          <div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <strong>مجموع الساعات:</strong> {totalHours.toFixed(2)}
          </div>
        </div>
      </Card>

      <Card title="السجلات" variant="elevated">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-gray-500 py-4 text-center">جاري التحميل...</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">لا توجد ساعات في هذا الشهر</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-right py-2.5 px-3">السكرتيرة</th>
                  <th className="text-right py-2.5 px-3">التاريخ</th>
                  <th className="text-right py-2.5 px-3">الساعات</th>
                  <th className="text-right py-2.5 px-3">ملاحظة</th>
                  <th className="text-right py-2.5 px-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-200">
                    <td className="py-2 px-3">{row.user?.username || `مستخدم ${row.user_id}`}</td>
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
