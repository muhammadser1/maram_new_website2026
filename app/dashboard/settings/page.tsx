'use client';

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api-client';
import { Teacher, IndividualLesson, GroupLesson } from '@/types';
import { getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date';

interface AppSettings {
  teachers_can_add_students?: boolean;
  lesson_submission_deadline_day?: string | number;
  lesson_submission_deadline_inclusive?: boolean;
}

const exportYears = [2024, 2025, 2026, 2027, 2028];
const exportMonths = [
  { value: 'all', label: 'كل الأشهر' },
  { value: '01', label: 'يناير' },
  { value: '02', label: 'فبراير' },
  { value: '03', label: 'مارس' },
  { value: '04', label: 'أبريل' },
  { value: '05', label: 'مايو' },
  { value: '06', label: 'يونيو' },
  { value: '07', label: 'يوليو' },
  { value: '08', label: 'أغسطس' },
  { value: '09', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' },
  { value: '12', label: 'ديسمبر' },
];

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [teachersZipLoading, setTeachersZipLoading] = useState(false);
  const [teachersZipError, setTeachersZipError] = useState<string | null>(null);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsRes, teachersRes] = await Promise.all([
        api.getSettings(),
        isAdmin ? api.getTeachers() : Promise.resolve({ success: true, data: [] }),
      ]);
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (teachersRes.success && Array.isArray(teachersRes.data)) {
        setTeachers(teachersRes.data as Teacher[]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const teachersCanAdd = settings.teachers_can_add_students ?? true;
      const day = String(Number(settings.lesson_submission_deadline_day) || 2);
      const inclusive = settings.lesson_submission_deadline_inclusive ?? true;

      const r1 = await api.updateSetting('teachers_can_add_students', teachersCanAdd);
      if (!r1.success) {
        setError(r1.error || 'فشل حفظ الإعدادات');
        return;
      }
      const r2 = await api.updateSetting('lesson_submission_deadline_day', day);
      if (!r2.success) {
        setError(r2.error || 'فشل حفظ الإعدادات');
        return;
      }
      const r3 = await api.updateSetting('lesson_submission_deadline_inclusive', inclusive);
      if (!r3.success) {
        setError(r3.error || 'فشل حفظ الإعدادات');
        return;
      }

      setSuccess('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    if (!isAdmin) return;
    setBackupError(null);
    setBackupLoading(true);
    try {
      const response = await api.getFullBackup();
      if (!response.success || !response.data) {
        setBackupError(response.error || 'فشل إنشاء النسخة الاحتياطية');
        return;
      }
      const csvContent = response.data?.csv;
      if (!csvContent) {
        setBackupError('لا توجد بيانات للتحميل');
        return;
      }
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
      link.download = `backup-${datePart}-${timePart}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setBackupError(err?.message || 'حدث خطأ أثناء تحميل النسخة الاحتياطية');
    } finally {
      setBackupLoading(false);
    }
  };

  const sanitizeFilenamePart = (value: string) =>
    value.replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF-]/g, '') || 'file';

  const getExportPeriod = (year: number, month: string) => ({
    dateFrom: month === 'all' ? `${year}-01-01` : getFirstDayOfMonth(year, parseInt(month, 10)),
    dateTo: month === 'all' ? `${year}-12-31` : getLastDayOfMonth(year, parseInt(month, 10)),
    monthLabel: exportMonths.find((m) => m.value === month)?.label || month,
  });

  const buildTeacherCsv = (rows: Array<{
    type: string;
    date: string;
    start_time: string;
    student: string;
    education_level: string;
    hours: number;
    approved: string;
    deleted: string;
    deletion_note: string;
  }>) => {
    const headers = ['النوع', 'التاريخ', 'وقت البدء', 'الطالب/الطلاب', 'المستوى التعليمي', 'الساعات', 'معتمد', 'محذوف', 'ملاحظة الحذف'];
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        [
          row.type,
          row.date,
          row.start_time,
          row.student,
          row.education_level,
          row.hours.toString(),
          row.approved,
          row.deleted,
          row.deletion_note,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    return '\uFEFF' + csvContent;
  };

  const fetchTeacherCsv = async (teacherId: number, year: number, month: string) => {
    const { dateFrom, dateTo } = getExportPeriod(year, month);
    const [indRes, indDeletedRes, grpRes, grpDeletedRes] = await Promise.all([
      api.getIndividualLessons({ teacher_id: teacherId, date_from: dateFrom, date_to: dateTo }),
      api.getIndividualLessons({ teacher_id: teacherId, date_from: dateFrom, date_to: dateTo, show_deleted: 'true' }),
      api.getGroupLessons({ teacher_id: teacherId, date_from: dateFrom, date_to: dateTo }),
      api.getGroupLessons({ teacher_id: teacherId, date_from: dateFrom, date_to: dateTo, show_deleted: 'true' }),
    ]);

    if (!indRes.success) throw new Error(indRes.error || 'Failed to fetch individual lessons');
    if (!indDeletedRes.success) throw new Error(indDeletedRes.error || 'Failed to fetch deleted individual lessons');
    if (!grpRes.success) throw new Error(grpRes.error || 'Failed to fetch group lessons');
    if (!grpDeletedRes.success) throw new Error(grpDeletedRes.error || 'Failed to fetch deleted group lessons');

    const individualLessons = [
      ...(Array.isArray(indRes.data) ? indRes.data : []),
      ...(Array.isArray(indDeletedRes.data) ? indDeletedRes.data : []),
    ] as IndividualLesson[];

    const groupLessons = [
      ...(Array.isArray(grpRes.data) ? grpRes.data : []),
      ...(Array.isArray(grpDeletedRes.data) ? grpDeletedRes.data : []),
    ] as GroupLesson[];

    const rows: Array<{
      type: string;
      date: string;
      start_time: string;
      student: string;
      education_level: string;
      hours: number;
      approved: string;
      deleted: string;
      deletion_note: string;
    }> = [];

    individualLessons.forEach((lesson) => {
      rows.push({
        type: lesson.subject?.name_ar ? `خاص - ${lesson.subject.name_ar}` : 'درس فردي',
        date: lesson.date,
        start_time: lesson.start_time || '',
        student: lesson.student?.full_name || 'غير محدد',
        education_level: lesson.education_level?.name_ar || '',
        hours: Number(lesson.hours) || 0,
        approved: lesson.approved ? 'نعم' : 'لا',
        deleted: lesson.deleted_at ? 'نعم' : 'لا',
        deletion_note: lesson.deletion_note || '',
      });
    });

    groupLessons.forEach((lesson) => {
      rows.push({
        type: lesson.subject?.name_ar ? `خاص - ${lesson.subject.name_ar}` : 'درس جماعي',
        date: lesson.date,
        start_time: lesson.start_time || '',
        student: lesson.students?.map((s) => s.full_name).join('، ') || 'غير محدد',
        education_level: lesson.education_level?.name_ar || '',
        hours: Number(lesson.hours) || 0,
        approved: lesson.approved ? 'نعم' : 'لا',
        deleted: lesson.deleted_at ? 'نعم' : 'لا',
        deletion_note: lesson.deletion_note || '',
      });
    });

    rows.sort((a, b) => b.date.localeCompare(a.date));
    return buildTeacherCsv(rows);
  };

  const downloadAllTeachersZipBackup = async () => {
    if (!isAdmin) return;
    if (!teachers.length) {
      setTeachersZipError('لا يوجد معلمون للتصدير');
      return;
    }

    setTeachersZipError(null);
    setTeachersZipLoading(true);
    try {
      const zip = new JSZip();
      const { monthLabel } = getExportPeriod(exportYear, exportMonth);
      const folderName = `teachers_lessons_${exportYear}_${sanitizeFilenamePart(monthLabel)}`;
      const folder = zip.folder(folderName) || zip;

      await Promise.all(
        teachers.map(async (teacher) => {
          const csv = await fetchTeacherCsv(teacher.id, exportYear, exportMonth);
          const teacherName = sanitizeFilenamePart(teacher.full_name || `teacher_${teacher.id}`);
          const fileName = `${teacherName}_lessons_${exportYear}_${exportMonth}_${sanitizeFilenamePart(monthLabel)}.csv`;
          folder.file(fileName, csv);
        })
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
      const fileName = `teachers-lessons-backup-${exportYear}-${exportMonth}-${datePart}-${timePart}.zip`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setTeachersZipError(err?.message || 'حدث خطأ أثناء تحميل النسخة الاحتياطية للمعلمين');
    } finally {
      setTeachersZipLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <Card title="إعدادات المعلمين" variant="elevated" className="mb-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                السماح للمعلمين بإضافة طلاب
              </h3>
              <p className="text-sm text-gray-600">
                عند تفعيل هذا الخيار، يمكن للمعلمين إضافة طلاب جدد. عند إلغاء التفعيل، يمكن
                للمعلمين فقط اختيار طلاب موجودين.
              </p>
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.teachers_can_add_students ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, teachers_can_add_students: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card title="موعد إضافة الدروس" variant="elevated" className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          آخر موعد يسمح فيه للمعلمين بإضافة دروس لشهر معيّن: يوم من الشهر التالي. مثلاً: يوم 2 يعني أن دروس شباط يمكن إضافتها حتى 2 آذار (إن كان مشمولاً).
        </p>
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block font-semibold text-gray-900 mb-1">
              يوم الشهر التالي (آخر يوم مسموح)
            </label>
            <p className="text-sm text-gray-600 mb-2">
              من 1 (الأول) إلى 31. القيمة الافتراضية: 2.
            </p>
            <Input
              type="number"
              min={1}
              max={31}
              value={Number(settings.lesson_submission_deadline_day) || 2}
              onChange={(e) => {
                const v = e.target.value ? parseInt(e.target.value, 10) : 2;
                const num = Number.isFinite(v) && v >= 1 && v <= 31 ? v : 2;
                setSettings((prev) => ({ ...prev, lesson_submission_deadline_day: num }));
              }}
              className="w-24 text-left"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                ذلك اليوم مشمول (مسموح فيه)
              </h3>
              <p className="text-sm text-gray-600">
                إذا مفعّل: آخر يوم مسموح = ذلك اليوم. إذا غير مفعّل: ذلك اليوم غير مسموح (آخر يوم = اليوم السابق).
              </p>
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.lesson_submission_deadline_inclusive ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, lesson_submission_deadline_inclusive: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <Card title="نسخ احتياطي للبيانات" variant="elevated" className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            تحميل ملف JSON يحتوي على جميع الدروس (مع أسماء المعلمين والطلاب)، المدفوعات، وملاحظات الدروس الخاصة. احتفظ بالملف في مكان آمن في حال تعطل قاعدة البيانات.
          </p>
          {backupError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {backupError}
            </div>
          )}
          <Button onClick={downloadBackup} disabled={backupLoading}>
            {backupLoading ? 'جاري إنشاء الملف...' : 'تحميل نسخة احتياطية كاملة'}
          </Button>
        </Card>
      )}

      {isAdmin && (
        <Card title="نسخة احتياطية لدروس المعلمين" variant="elevated" className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            تحميل ملف ZIP يحتوي على ملف CSV منفصل لكل معلم حسب الشهر المختار أو لكل الأشهر. هذا مناسب كنسخة احتياطية لتقارير الدروس الشهرية للمعلمين.
          </p>
          {teachersZipError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {teachersZipError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Select
              label="السنة"
              value={exportYear.toString()}
              onChange={(e) => setExportYear(Number(e.target.value))}
              options={exportYears.map((year) => ({
                value: year.toString(),
                label: year.toString(),
              }))}
            />
            <Select
              label="الشهر"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              options={exportMonths}
            />
          </div>
          <Button onClick={downloadAllTeachersZipBackup} disabled={teachersZipLoading}>
            {teachersZipLoading ? 'جاري إنشاء ملف ZIP...' : 'تحميل ZIP لجميع المعلمين'}
          </Button>
        </Card>
      )}
    </div>
  );
}

