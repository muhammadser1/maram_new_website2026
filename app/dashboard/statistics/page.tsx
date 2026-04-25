'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { IndividualLesson, GroupLesson, EducationLevel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatLocalDate } from '@/lib/utils/date';

/** Placeholder type for removed remedial lessons (array is always empty). */
interface RemedialLessonPlaceholder {
  approved?: boolean;
  hours?: number;
  teacher_id?: number;
  teacher?: { full_name?: string };
  student_id?: number;
  student?: { id: number; full_name?: string | null; education_level?: { name_ar?: string | null } | null; class?: string | null };
  date?: string;
  start_time?: string;
  total_cost?: number;
  deleted_at?: string | null;
  deletion_note?: string | null;
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <Card className="relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(238,246,252,0.9)_100%)] shadow-[0_22px_50px_-28px_rgba(11,58,116,0.24)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
      <div className="relative z-10">
        <p className="text-sm font-semibold text-[#1b5dab]">{title}</p>
        <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
        {description && <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>}
      </div>
    </Card>
  );
}

interface TeacherLevelRow {
  teacherId: number | null;
  teacherName: string;
  __search?: string;
  [key: string]: string | number | null | undefined;
}

const formatHours = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  const normalized = Math.round((value + Number.EPSILON) * 100) / 100;
  const text = normalized.toString();
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
};

export default function StatisticsPage() {
  const { isTeacher, isAdmin, loading: authLoading, teacher } = useAuth();
  const [individualLessons, setIndividualLessons] = useState<IndividualLesson[]>([]);
  const [groupLessons, setGroupLessons] = useState<GroupLesson[]>([]);
  const [remedialLessons] = useState<RemedialLessonPlaceholder[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const statsYears = [2024, 2025, 2026];
  const statsMonths = [
    { value: 'all', label: 'كل الشهور' },
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
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [statsYear, setStatsYear] = useState<string>(
    statsYears.includes(currentYear) ? String(currentYear) : String(statsYears[0])
  );
  const [statsMonth, setStatsMonth] = useState(currentMonth);
  const [adminSearch, setAdminSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isTeacher && !isAdmin) {
      setLoading(false);
      return;
    }
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isTeacher, isAdmin, statsYear, statsMonth]);

  const getDateFilters = (year: string, month: string) => {
    if (year === 'all') {
      return {};
    }

    const numericYear = Number(year);
    // "all" = entire year (all months)
    if (month === 'all') {
      return {
        date_from: `${numericYear}-01-01`,
        date_to: `${numericYear}-12-31`,
      };
    }
    // Use local date formatting to avoid timezone issues
    const start = new Date(numericYear, Number(month) - 1, 1);
    const end = new Date(numericYear, Number(month), 0);
    return {
      date_from: formatLocalDate(start),
      date_to: formatLocalDate(end),
    };
  };

  const loadStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const dateFilters = getDateFilters(statsYear, statsMonth);
      const approvedFilters = { ...dateFilters, approved: true };
      const promises: Promise<any>[] = [
        api.getIndividualLessons(approvedFilters),
        api.getGroupLessons(approvedFilters),
        Promise.resolve({ success: true, data: [] }),
        api.getEducationLevels(),
      ];
      const results = await Promise.all(promises);
      const [individualRes, groupRes, _remedialRes, levelsRes] = results;

      if (individualRes.success && Array.isArray(individualRes.data)) {
        setIndividualLessons(individualRes.data as IndividualLesson[]);
      } else {
        setError(individualRes.error || 'فشل في تحميل الدروس الفردية');
      }
      if (groupRes.success && Array.isArray(groupRes.data)) {
        setGroupLessons(groupRes.data as GroupLesson[]);
      } else {
        setError((prev) => prev || groupRes.error || 'فشل في تحميل الدروس الجماعية');
      }
      if (levelsRes.success && Array.isArray(levelsRes.data)) {
        setEducationLevels(levelsRes.data as EducationLevel[]);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const totalApprovedIndividualHours = useMemo(
    () =>
      individualLessons
        .filter((lesson) => lesson.approved)
        .reduce((sum, lesson) => sum + (Number(lesson.hours) || 0), 0),
    [individualLessons]
  );

  const totalApprovedGroupHours = useMemo(
    () =>
      groupLessons
        .filter((lesson) => lesson.approved)
        .reduce((sum, lesson) => sum + (Number(lesson.hours) || 0), 0),
    [groupLessons]
  );

  const totalApprovedRemedialHours = useMemo(
    () =>
      remedialLessons
        .filter((lesson) => lesson.approved)
        .reduce((sum, lesson) => sum + (Number(lesson.hours) || 0), 0),
    [remedialLessons]
  );

  const totalApprovedHours = totalApprovedIndividualHours + totalApprovedGroupHours + totalApprovedRemedialHours;
  const totalApprovedIndividualLessons = useMemo(
    () => individualLessons.filter((lesson) => lesson.approved).length,
    [individualLessons]
  );
  const totalApprovedGroupLessons = useMemo(
    () => groupLessons.filter((lesson) => lesson.approved).length,
    [groupLessons]
  );
  const totalApprovedRemedialLessons = useMemo(
    () => remedialLessons.filter((lesson) => lesson.approved).length,
    [remedialLessons]
  );

  const lessonsByLevel = useMemo(() => {
    const levelMap = new Map<
      string,
      {
        label: string;
        individualHours: number;
        groupHours: number;
        totalHours: number;
        individualLessons: number;
        groupLessons: number;
      }
    >();

    const addLesson = (
      levelName: string | undefined | null,
      hours: number | undefined,
      type: 'individual' | 'group'
    ) => {
      const key = levelName || 'غير محدد';
      const entry =
        levelMap.get(key) || {
          label: key,
          individualHours: 0,
          groupHours: 0,
          totalHours: 0,
          individualLessons: 0,
          groupLessons: 0,
        };
      const value = hours || 0;
      entry.totalHours += value;
      if (type === 'individual') {
        entry.individualHours += value;
        entry.individualLessons += 1;
      } else {
        entry.groupHours += value;
        entry.groupLessons += 1;
      }
      levelMap.set(key, entry);
    };

    individualLessons.forEach((lesson) => {
      if (lesson.approved) {
        addLesson(lesson.education_level?.name_ar, Number(lesson.hours), 'individual');
      }
    });

    groupLessons.forEach((lesson) => {
      if (lesson.approved) {
        addLesson(lesson.education_level?.name_ar, Number(lesson.hours), 'group');
      }
    });

    return Array.from(levelMap.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [individualLessons, groupLessons]);

  const showTeacherView = isTeacher && !isAdmin;
  const showAdminView = isAdmin;

  const adminTeacherStats = useMemo(() => {
    if (!showAdminView) {
      return { rows: [] as TeacherLevelRow[], levels: [] as string[] };
    }

    // Start with all education levels from the database
    const allLevelNames = educationLevels.map((level) => level.name_ar).filter(Boolean);
    const levelSet = new Set<string>(allLevelNames);

    type SpecialSubjectStats = {
      lessons: number;
      hours: number;
    };

    type LevelStats = {
      individualLessons: number;
      individualHours: number;
      groupLessons: number;
      groupHours: number;
      specialBySubject: Record<string, SpecialSubjectStats>;
    };

    const teacherMap = new Map<
      number | null,
      {
        teacherId: number | null;
        teacherName: string;
        levels: Map<string, LevelStats>;
      }
    >();

    const ensureTeacher = (id: number | null, name: string) => {
      const existing = teacherMap.get(id);
      if (existing) return existing;
      const entry = {
        teacherId: id,
        teacherName: name,
        levels: new Map<string, LevelStats>(),
      };
      teacherMap.set(id, entry);
      return entry;
    };

    const getDefaultLevelStats = (): LevelStats => ({
      individualLessons: 0,
      individualHours: 0,
      groupLessons: 0,
      groupHours: 0,
      specialBySubject: {},
    });

    const addLesson = (
      lesson:
        | (IndividualLesson & {
            education_level?: { name_ar?: string | null } | null;
            subject_id?: number | null;
            subject?: { name_ar?: string | null } | null;
          })
        | (GroupLesson & {
            education_level?: { name_ar?: string | null } | null;
            subject_id?: number | null;
            subject?: { name_ar?: string | null } | null;
          }),
      type: 'individual' | 'group'
    ) => {
      if (!lesson.teacher_id) return;
      const teacherName = lesson.teacher?.full_name || `معلم ${lesson.teacher_id}`;
      const levelName = lesson.education_level?.name_ar || 'غير محدد';
      levelSet.add(levelName);
      const teacherEntry = ensureTeacher(lesson.teacher_id, teacherName);
      const levelEntry = teacherEntry.levels.get(levelName) || getDefaultLevelStats();
      const hours = Number(lesson.hours) || 0;
      const isSpecial = Boolean(lesson.subject_id);

      if (isSpecial) {
        const subjectName =
          lesson.subject?.name_ar ||
          // Fallback generic label if subject missing
          (levelName === 'ابتدائي' || levelName === 'إعدادي' ? 'הוראה מתקנת' : 'درس خاص');
        const current = levelEntry.specialBySubject[subjectName] || {
          lessons: 0,
          hours: 0,
        };
        current.lessons += 1;
        current.hours += hours;
        levelEntry.specialBySubject[subjectName] = current;
      } else {
        if (type === 'individual') {
          levelEntry.individualLessons += 1;
          levelEntry.individualHours += hours;
        } else {
          levelEntry.groupLessons += 1;
          levelEntry.groupHours += hours;
        }
      }

      teacherEntry.levels.set(levelName, levelEntry);
    };

    individualLessons.forEach((lesson) => {
      if (lesson.approved) {
        addLesson(lesson, 'individual');
      }
    });

    groupLessons.forEach((lesson) => {
      if (lesson.approved) {
        const levelName = lesson.education_level?.name_ar;
        if (levelName !== 'جامعي') {
          addLesson(lesson, 'group');
        }
      }
    });

    const levels = Array.from(levelSet.values()).sort((a, b) =>
      a.localeCompare(b, 'ar')
    );

    const rows = Array.from(teacherMap.values())
      .map<TeacherLevelRow>((teacherEntry) => {
        const row: TeacherLevelRow = {
          teacherId: teacherEntry.teacherId,
          teacherName: teacherEntry.teacherName,
        };
        const searchParts: string[] = [teacherEntry.teacherName];

        levels.forEach((level) => {
          searchParts.push(level);
          const stats = teacherEntry.levels.get(level) || getDefaultLevelStats();

          const lines: string[] = [];
          const indivText = `${stats.individualLessons} درس (${formatHours(
            stats.individualHours
          )} ساعة)`;
          const groupText = `${stats.groupLessons} درس (${formatHours(
            stats.groupHours
          )} ساعة)`;
          lines.push(`فردي: ${indivText}`);
          lines.push(`جماعي: ${groupText}`);

          const subjectNames = Object.keys(stats.specialBySubject);
          subjectNames.sort((a, b) => a.localeCompare(b, 'ar'));

          subjectNames.forEach((subjectName) => {
            const s = stats.specialBySubject[subjectName];
            lines.push(
              `${subjectName}: ${s.lessons} درس (${formatHours(s.hours)} ساعة)`
            );
            searchParts.push(subjectName);
          });

          row[level] = lines.join('\n');
        });

        row.__search = searchParts.join(' ').toLowerCase();
        return row;
      })
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ar'));

    return { rows, levels };
  }, [individualLessons, groupLessons, showAdminView, educationLevels]);

  const filteredTeacherStats = useMemo(() => {
    const { rows } = adminTeacherStats;
    if (!adminSearch) return rows;
    const search = adminSearch.toLowerCase();
    return rows.filter(
      (stat) =>
        stat.teacherName.toLowerCase().includes(search) ||
        stat.__search?.includes(search)
    );
  }, [adminTeacherStats, adminSearch]);

  const teacherColumns = useMemo<TableColumn<TeacherLevelRow>[]>(() => {
    const columns: TableColumn<TeacherLevelRow>[] = [
      { key: 'teacherName', header: 'المعلم' },
    ];
    adminTeacherStats.levels.forEach((level) => {
      columns.push({
        key: level,
        header: level,
        render: (row) => {
          const value = (row[level] as string) || '';
          if (!value) return '—';
          const lines = value.split('\n').filter(Boolean);
          return (
            <div className="space-y-1 text-sm leading-5">
              {lines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          );
        },
      });
    });
    return columns;
  }, [adminTeacherStats.levels]);

  const selectedMonthLabel =
    statsMonths.find((month) => month.value === statsMonth)?.label || 'الشهر الحالي';
  const selectedPeriodLabel =
    statsYear === 'all'
      ? 'كل السنوات'
      : statsMonth === 'all'
      ? `كل شهور ${statsYear}`
      : `${selectedMonthLabel} ${statsYear}`;
  const pageShellClassName =
    'relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,_#eef6fc_0%,_#f8fbff_38%,_#eef5fb_100%)] p-4 sm:p-6';
  const surfaceCardClassName =
    'relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-white/92 shadow-[0_24px_60px_-30px_rgba(11,58,116,0.22)]';
  const filterCardClassName =
    'relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(238,246,252,0.92)_100%)] shadow-[0_22px_50px_-28px_rgba(11,58,116,0.2)]';


  if (authLoading || loading) {
    return (
      <div className="text-center py-12 text-gray-900" dir="rtl">
        جاري تحميل الإحصائيات...
      </div>
    );
  }

  if (!showTeacherView && !showAdminView) {
    return (
      <div dir="rtl" className={pageShellClassName}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 right-[-3rem] h-52 w-52 rounded-full bg-[#1b5dab]/10 blur-3xl"></div>
          <div className="absolute bottom-[-4rem] left-[-2rem] h-64 w-64 rounded-full bg-[#f1d980]/18 blur-3xl"></div>
        </div>
        <Card title="الإحصائيات" className={`${surfaceCardClassName} relative z-10`}>
          <p className="text-gray-600">
            لا تمتلك الصلاحيات للاطلاع على الإحصائيات.
          </p>
        </Card>
      </div>
    );
  }

  if (showAdminView) {
  return (
      <div dir="rtl" className={pageShellClassName}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 right-[-3rem] h-52 w-52 rounded-full bg-[#1b5dab]/10 blur-3xl"></div>
          <div className="absolute bottom-[-4rem] left-[-2rem] h-64 w-64 rounded-full bg-[#f1d980]/18 blur-3xl"></div>
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(168deg, transparent 0 26px, rgba(27,93,171,0.18) 26px 28px)',
              transform: 'scale(1.12)',
              transformOrigin: 'top right',
            }}
          ></div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,_#0b3a74_0%,_#0a3569_100%)] px-6 py-8 text-white shadow-[0_26px_60px_-30px_rgba(11,58,116,0.45)] sm:px-8">
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(168deg, transparent 0 26px, rgba(147,197,253,0.22) 26px 28px)',
                transform: 'scale(1.2)',
                transformOrigin: 'top right',
              }}
            ></div>
            <div className="absolute inset-x-0 bottom-0 h-3 bg-[#f1d980]"></div>
            <div className="absolute -top-6 left-10 h-32 w-32 rounded-full bg-[#8bc1ff]/12 blur-3xl"></div>

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-blue-50/90 shadow-sm backdrop-blur-md">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f1d980]"></span>
                  لوحة الإحصائيات
                </div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">إحصائيات الإدارة</h1>
                <p className="mt-3 max-w-2xl text-base leading-8 text-blue-50/90 sm:text-lg">
                  متابعة أداء المعلمين للفترة المحددة. <strong>الدروس المعتمدة فقط.</strong>
                </p>
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <div className="text-sm font-semibold text-[#f1d980]">الفترة النشطة</div>
                <div className="mt-2 text-2xl font-black">{selectedPeriodLabel}</div>
              </div>
            </div>
          </div>

          <Card title="تصفية الإحصائيات" className={filterCardClassName}>
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_180px_minmax(220px,1fr)]">
              <Select
                label="اختر السنة"
                value={statsYear}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatsYear(value);
                  if (value === 'all') {
                    setStatsMonth('all');
                  }
                }}
                options={[
                  { value: 'all', label: 'كل السنوات' },
                  ...statsYears.map((year) => ({ value: String(year), label: `${year}` })),
                ]}
                className="border-blue-100 bg-white focus:border-[#1b5dab] focus:ring-[#1b5dab]"
              />
              <Select
                label="اختر الشهر"
                value={statsMonth}
                onChange={(e) => setStatsMonth(e.target.value)}
                options={statsMonths}
                className="border-blue-100 bg-white focus:border-[#1b5dab] focus:ring-[#1b5dab]"
                disabled={statsYear === 'all'}
              />
              <Input
                label="بحث"
                placeholder="ابحث عن معلم"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="border-blue-100 bg-white focus:border-[#1b5dab] focus:ring-[#1b5dab]"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              title="عدد المعلمين الظاهرين"
              value={`${filteredTeacherStats.length}`}
              description="بحسب نتائج البحث الحالية في الجدول."
            />
            <StatCard
              title="عدد المستويات"
              value={`${adminTeacherStats.levels.length}`}
              description="المستويات التعليمية المضمنة في التقرير."
            />
            <StatCard
              title="الفترة"
              value={selectedPeriodLabel}
              description="يمكنك تغيير السنة أو الشهر من الفلاتر أعلاه."
            />
          </div>

          {error && (
            <div className="rounded-[24px] border border-red-200 bg-[linear-gradient(180deg,_#fff5f5_0%,_#fff0f0_100%)] px-5 py-4 text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <Card title="إحصائيات المعلمين حسب المستوى" className={`${surfaceCardClassName} p-0`}>
            <div className="border-b border-blue-100 px-6 py-4">
              <div className="text-lg font-black text-[#0b3a74]">تفصيل الأداء حسب المستوى</div>
              <p className="mt-1 text-sm text-slate-600">جدول يلخص الساعات وعدد الدروس لكل معلم.</p>
            </div>
            <div className="p-4 pt-0">
              {filteredTeacherStats.length === 0 ? (
                <p className="py-8 text-center text-gray-500">لا توجد بيانات مطابقة للتصفية الحالية</p>
              ) : (
                <Table columns={teacherColumns} data={filteredTeacherStats} />
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Teacher view (existing)
  return (
    <div dir="rtl" className={pageShellClassName}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 right-[-3rem] h-52 w-52 rounded-full bg-[#1b5dab]/10 blur-3xl"></div>
        <div className="absolute bottom-[-4rem] left-[-2rem] h-64 w-64 rounded-full bg-[#f1d980]/18 blur-3xl"></div>
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(168deg, transparent 0 26px, rgba(27,93,171,0.18) 26px 28px)',
            transform: 'scale(1.12)',
            transformOrigin: 'top right',
          }}
        ></div>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,_#0b3a74_0%,_#0a3569_100%)] px-6 py-8 text-white shadow-[0_26px_60px_-30px_rgba(11,58,116,0.45)] sm:px-8">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'repeating-linear-gradient(168deg, transparent 0 26px, rgba(147,197,253,0.22) 26px 28px)',
              transform: 'scale(1.2)',
              transformOrigin: 'top right',
            }}
          ></div>
          <div className="absolute inset-x-0 bottom-0 h-3 bg-[#f1d980]"></div>
          <div className="absolute -top-6 left-10 h-32 w-32 rounded-full bg-[#8bc1ff]/12 blur-3xl"></div>

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-blue-50/90 shadow-sm backdrop-blur-md">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f1d980]"></span>
                لوحة الإحصائيات
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">إحصائيات المدرس</h1>
              {teacher && (
                <p className="mt-3 max-w-2xl text-base leading-8 text-blue-50/90 sm:text-lg">
                  مرحبًا {teacher.full_name}، إليك ملخص أدائك خلال الفترة المحددة. <strong>الدروس المعتمدة فقط.</strong>
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <div className="text-sm font-semibold text-[#f1d980]">الفترة النشطة</div>
              <div className="mt-2 text-2xl font-black">{selectedPeriodLabel}</div>
            </div>
          </div>
        </div>

        <Card title="تصفية الإحصائيات" className={filterCardClassName}>
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_180px]">
            <Select
              label="اختر السنة"
              value={statsYear}
              onChange={(e) => {
                const value = e.target.value;
                setStatsYear(value);
                if (value === 'all') {
                  setStatsMonth('all');
                }
              }}
              options={[
                { value: 'all', label: 'كل السنوات' },
                ...statsYears.map((year) => ({ value: String(year), label: `${year}` })),
              ]}
              className="border-blue-100 bg-white focus:border-[#1b5dab] focus:ring-[#1b5dab]"
            />
            <Select
              label="اختر الشهر"
              value={statsMonth}
              onChange={(e) => setStatsMonth(e.target.value)}
              options={statsMonths}
              className="border-blue-100 bg-white focus:border-[#1b5dab] focus:ring-[#1b5dab]"
              disabled={statsYear === 'all'}
            />
          </div>
        </Card>

        {error && (
          <div className="rounded-[24px] border border-red-200 bg-[linear-gradient(180deg,_#fff5f5_0%,_#fff0f0_100%)] px-5 py-4 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي الساعات المعتمدة"
            value={`${totalApprovedHours} ساعة`}
            description="يشمل الدروس الفردية والجماعية והוראה מתקנת المعتمدة"
          />
          <StatCard
            title="ساعات الدروس الفردية"
            value={`${totalApprovedIndividualHours} ساعة`}
            description={`${totalApprovedIndividualLessons} درس فردي معتمد`}
          />
          <StatCard
            title="ساعات الدروس الجماعية"
            value={`${totalApprovedGroupHours} ساعة`}
            description={`${totalApprovedGroupLessons} درس جماعي معتمد`}
          />
          <StatCard
            title="ساعات הוראה מתקנת"
            value={`${totalApprovedRemedialHours} ساعة`}
            description={`${totalApprovedRemedialLessons} درس הוראה מתקנת معتمد`}
          />
        </div>

        <Card title="توزيع الساعات حسب المستوى" className={`${surfaceCardClassName} p-0`}>
          <div className="border-b border-blue-100 px-6 py-4">
            <div className="text-lg font-black text-[#0b3a74]">توزيع الأداء حسب المستوى</div>
            <p className="mt-1 text-sm text-slate-600">عرض إجمالي الساعات المعتمدة موزعة على المستويات التعليمية.</p>
          </div>
          <div className="p-4 pt-0">
            {lessonsByLevel.length === 0 ? (
              <p className="py-8 text-center text-gray-500">لا توجد دروس معتمدة لعرضها</p>
            ) : (
              <Table
                columns={[
                  { key: 'label', header: 'المستوى التعليمي' },
                  {
                    key: 'totalHours',
                    header: 'إجمالي الساعات',
                    render: (row) => `${row.totalHours} ساعة`,
                  },
                  {
                    key: 'individualHours',
                    header: 'ساعات فردية',
                    render: (row) => `${row.individualHours} ساعة (${row.individualLessons} درس)`,
                  },
                  {
                    key: 'groupHours',
                    header: 'ساعات جماعية',
                    render: (row) => `${row.groupHours} ساعة (${row.groupLessons} درس)`,
                  },
                ]}
                data={lessonsByLevel}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
