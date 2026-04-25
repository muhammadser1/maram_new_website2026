'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { config } from '@/lib/config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Student,
  EducationLevel,
  IndividualLesson,
  GroupLesson,
  GroupPricingTier,
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date';

const ITEMS_PER_PAGE = 10;
const formatCurrency = (value: number) => `${value.toFixed(2)} ₪`;

interface StudentSummary {
  studentId: number;
  studentName: string;
  levelName: string;
  individualDue: number;
  groupDue: number;
  remedialDue: number;
  totalDue: number;
  totalPaid: number;
  remaining: number;
}

interface CalculationRow {
  type: 'individual' | 'group' | 'remedial' | 'special_individual' | 'special_group';
  typeLabel: string;
  date: string;
  hours: number;
  cost: number;
  note?: string;
  teacherName?: string;
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** Background colors for each month block (alternating palette) */
const monthBlockColors = [
  'bg-blue-50 border-r-4 border-blue-400',
  'bg-amber-50 border-r-4 border-amber-400',
  'bg-emerald-50 border-r-4 border-emerald-400',
  'bg-violet-50 border-r-4 border-violet-400',
  'bg-rose-50 border-r-4 border-rose-400',
  'bg-sky-50 border-r-4 border-sky-400',
  'bg-teal-50 border-r-4 border-teal-400',
  'bg-teal-50 border-r-4 border-teal-400',
  'bg-indigo-50 border-r-4 border-indigo-400',
  'bg-lime-50 border-r-4 border-lime-500',
];

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [paymentsByStudent, setPaymentsByStudent] = useState<Record<number, number>>({});
  const [groupPricingTiers, setGroupPricingTiers] = useState<GroupPricingTier[]>([]);

  const [search, setSearch] = useState('');
  const [educationLevelId, setEducationLevelId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentLessons, setSelectedStudentLessons] = useState<{
    individual: IndividualLesson[];
    group: GroupLesson[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        api.getStudents(),
        api.getEducationLevels(),
        api.getDuesSummary(),
      ];
      if (config.app.groupPricingMode === 'tiers') {
        promises.push(api.getGroupPricingTiers());
      }
      const [studentsRes, levelsRes, duesRes, tiersRes] = await Promise.all(promises);

      if (studentsRes.success && Array.isArray(studentsRes.data)) {
        setStudents(studentsRes.data as Student[]);
      }
      if (levelsRes.success && Array.isArray(levelsRes.data)) {
        setEducationLevels(levelsRes.data as EducationLevel[]);
      }
      if (config.app.groupPricingMode === 'tiers' && tiersRes?.success && Array.isArray(tiersRes.data)) {
        setGroupPricingTiers(tiersRes.data as GroupPricingTier[]);
      }

      const rawDues = duesRes?.success && Array.isArray(duesRes.data) ? duesRes.data : [];
      const dues = (rawDues as any[]).map((r) => ({
        studentId: Number(r.student_id ?? r.studentId),
        studentName: String(r.student_name ?? r.studentName ?? ''),
        levelName: String(r.level_name ?? r.levelName ?? 'غير محدد'),
        individualDue: Number(r.individual_due ?? r.individualDue ?? 0),
        groupDue: Number(r.group_due ?? r.groupDue ?? 0),
        remedialDue: Number(r.remedial_due ?? r.remedialDue ?? 0),
        totalDue: Number(r.total_due ?? r.totalDue ?? 0),
        totalPaid: Number(r.total_paid ?? r.totalPaid ?? 0),
        remaining: Number(r.remaining ?? 0),
      }));

      // Patch group from lessons so table shows total (individual + group)
      const tiers = config.app.groupPricingMode === 'tiers' && tiersRes?.success && Array.isArray(tiersRes?.data)
        ? (tiersRes.data as GroupPricingTier[]) : [];
      const limit = 10000;
      const groupRes = await api.getGroupLessons({ approved: true, limit });
      const groupLessonsList = (groupRes.success && Array.isArray(groupRes.data) ? groupRes.data : []) as GroupLesson[];
      const patchMap: Record<number, { groupDue: number }> = {};
      dues.forEach((r) => { patchMap[r.studentId] = { groupDue: 0 }; });
      groupLessonsList.forEach((lesson) => {
        if (!lesson.approved) return;
        const participants = lesson.students || [];
        if (!participants.length) return;
        let totalForLesson = Number(lesson.total_cost) || 0;
        // Only use education-level tiers for regular group (no subject). Group+subject use DB total_cost.
        if (config.app.groupPricingMode === 'tiers' && !lesson.subject_id) {
          const tier = tiers.find(
            (t) => t.education_level_id === lesson.education_level_id && t.student_count === participants.length
          );
          if (tier) totalForLesson = Number(tier.total_price) * Number(lesson.hours || 1);
        }
        if (totalForLesson <= 0) return;
        const share = totalForLesson / participants.length;
        participants.forEach((student: { id: number }) => {
          if (patchMap[student.id]) patchMap[student.id].groupDue += share;
        });
      });
      const patchedSummaries: StudentSummary[] = dues.map((r) => {
        const p = patchMap[r.studentId] || { groupDue: 0 };
        const groupDue = parseFloat(p.groupDue.toFixed(2));
        const remedialDue = Number(r.remedialDue ?? 0);
        const totalDue = r.individualDue + groupDue + remedialDue;
        const remaining = totalDue - r.totalPaid;
        return { ...r, groupDue, remedialDue, totalDue, remaining };
      });
      setSummaries(patchedSummaries);

      const paymentsRes = await api.getPayments();
      if (paymentsRes.success && Array.isArray(paymentsRes.data)) {
        const byStudent: Record<number, number> = {};
        (paymentsRes.data as any[]).forEach((p) => {
          const sid = Number(p.student_id ?? p.studentId);
          if (!sid) return;
          byStudent[sid] = (byStudent[sid] || 0) + Number(p.amount ?? 0);
        });
        setPaymentsByStudent(byStudent);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let list = students.filter((s) => !s.deleted_at);
    if (educationLevelId) {
      const id = parseInt(educationLevelId, 10);
      list = list.filter((s) => s.education_level_id === id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.parent_contact && s.parent_contact.includes(q))
      );
    }
    const remainingByStudent = new Map<number, number>();
    summaries.forEach((s) => remainingByStudent.set(s.studentId, s.remaining));
    return [...list].sort((a, b) => (remainingByStudent.get(b.id) ?? 0) - (remainingByStudent.get(a.id) ?? 0));
  }, [students, educationLevelId, search, summaries]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const summaryByStudent = useMemo(() => {
    const map = new Map<number, StudentSummary>();
    summaries.forEach((s) => map.set(s.studentId, s));
    return map;
  }, [summaries]);

  const openStudentDetail = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setSelectedStudentLessons(null);
    setSelectedMonthKey('all');
    setCollapsedMonths({});
    setDetailLoading(true);
    try {
      const [indRes, groupRes] = await Promise.all([
        api.getIndividualLessons({ student_id: studentId, approved: true }),
        api.getGroupLessons({ approved: true }),
      ]);
      const individual = (indRes.success && Array.isArray(indRes.data) ? indRes.data : []) as IndividualLesson[];
      const groupRaw = (groupRes.success && Array.isArray(groupRes.data) ? groupRes.data : []) as GroupLesson[];
      const group = groupRaw.filter((g) => g.students?.some((s: { id: number }) => s.id === studentId));
      setSelectedStudentLessons({ individual, group });
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const availableMonths = useMemo(() => {
    if (!selectedStudentLessons) return [];
    const set = new Set<string>();
    const add = (date: string) => {
      if (date && date.length >= 7) set.add(date.slice(0, 7));
    };
    selectedStudentLessons.individual.forEach((l) => add(l.date));
    selectedStudentLessons.group.forEach((l) => add(l.date));
    return Array.from(set).sort();
  }, [selectedStudentLessons]);

  useEffect(() => {
    if (!availableMonths.length) {
      setCollapsedMonths({});
      return;
    }

    const nextState: Record<string, boolean> = {};
    availableMonths.forEach((monthKey) => {
      nextState[monthKey] = true;
    });
    setCollapsedMonths(nextState);
  }, [availableMonths]);

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'كل الأشهر' }];
    availableMonths.forEach((ym) => {
      const [y, m] = ym.split('-');
      opts.push({ value: ym, label: `${monthNames[parseInt(m, 10) - 1]} ${y}` });
    });
    return opts;
  }, [availableMonths]);

  const breakdownForMonth = useMemo(() => {
    if (!selectedStudentId || !selectedStudentLessons) return null;
    const { individual: ind, group: grp } = selectedStudentLessons;
    const [year, month] = selectedMonthKey === 'all' ? [null, null] : selectedMonthKey.split('-').map(Number);
    const inRange = (date: string) => {
      if (!year || !month) return true;
      const [ly, lm] = date.split('-').map(Number);
      return ly === year && lm === month;
    };

    const rows: CalculationRow[] = [];
    const specialBySubjectMap = new Map<
      string,
      { lessons: number; hours: number; amount: number }
    >();
    let individualDue = 0,
      groupDue = 0,
      remedialDue = 0,
      specialDue = 0;
    let studentName = '';
    let levelName = '';

    ind.forEach((lesson) => {
      if (!lesson.approved || lesson.student_id !== selectedStudentId || !inRange(lesson.date)) return;
      studentName = lesson.student?.full_name || `طالب ${selectedStudentId}`;
      levelName = lesson.education_level?.name_ar || lesson.student?.education_level?.name_ar || 'غير محدد';
      const cost = Number(lesson.total_cost) || 0;
      const hours = Number(lesson.hours) || 0;
      const isSpecial = Boolean(lesson.subject_id);
      const subjectName = lesson.subject?.name_ar || 'درس خاص';
      const type: CalculationRow['type'] = isSpecial ? 'special_individual' : 'individual';
      const typeLabel = isSpecial
        ? subjectName
          ? `خاص - ${subjectName}`
          : 'فردي خاص'
        : 'فردي';
      rows.push({
        type,
        typeLabel,
        date: lesson.date,
        hours,
        cost,
        note: cost <= 0 ? 'لم يُحسب' : undefined,
        teacherName: lesson.teacher?.full_name || '-',
      });
      if (cost > 0) {
        individualDue += cost;
        if (isSpecial) {
          specialDue += cost;
          const key = subjectName;
          const current = specialBySubjectMap.get(key) || {
            lessons: 0,
            hours: 0,
            amount: 0,
          };
          current.lessons += 1;
          current.hours += hours;
          current.amount += cost;
          specialBySubjectMap.set(key, current);
        }
      }
    });

    grp.forEach((lesson) => {
      if (
        !lesson.approved ||
        !lesson.students?.some((s: { id: number }) => s.id === selectedStudentId) ||
        !inRange(lesson.date)
      )
        return;
      const participants = lesson.students || [];
      let totalForLesson = Number(lesson.total_cost) || 0;
      // Use same logic as payments table: in tiers mode for regular group, use tier total so report matches.
      if (config.app.groupPricingMode === 'tiers' && !lesson.subject_id) {
        const tier = groupPricingTiers.find(
          (t) => t.education_level_id === lesson.education_level_id && t.student_count === participants.length
        );
        if (tier) totalForLesson = Number(tier.total_price) * Number(lesson.hours || 1);
      }
      const hours = Number(lesson.hours) || 1;
      const share = totalForLesson > 0 ? totalForLesson / participants.length : 0;
      const isSpecial = Boolean(lesson.subject_id);
      const subjectName = lesson.subject?.name_ar || 'درس خاص';
      const type: CalculationRow['type'] = isSpecial ? 'special_group' : 'group';
      const typeLabel = isSpecial
        ? subjectName
          ? `خاص - ${subjectName}`
          : 'جماعي خاص'
        : 'جماعي';
      rows.push({
        type,
        typeLabel,
        date: lesson.date,
        hours,
        cost: parseFloat(share.toFixed(2)),
        note: totalForLesson > 0 ? `حصة من ${participants.length}` : `حصة من ${participants.length}`,
        teacherName: lesson.teacher?.full_name || '-',
      });
      if (totalForLesson > 0) {
        groupDue += share;
        if (isSpecial) {
          specialDue += share;
          const key = subjectName;
          const current = specialBySubjectMap.get(key) || {
            lessons: 0,
            hours: 0,
            amount: 0,
          };
          current.lessons += 1;
          current.hours += hours;
          current.amount += share;
          specialBySubjectMap.set(key, current);
        }
      }
    });

    const totalForMonth = individualDue + groupDue + remedialDue;

    // Compute total due from ALL lessons (individual + group)
    let indAll = 0, grpAll = 0;
    ind.forEach((l) => {
      if (!l.approved || l.student_id !== selectedStudentId) return;
      indAll += Number(l.total_cost) || 0;
    });
    grp.forEach((l) => {
      if (!l.approved || !l.students?.some((s: { id: number }) => s.id === selectedStudentId)) return;
      const participants = l.students || [];
      let totalForLesson = Number(l.total_cost) || 0;
      // Use same logic as payments: in tiers mode for regular group, use tier total.
      if (config.app.groupPricingMode === 'tiers' && !l.subject_id) {
        const tier = groupPricingTiers.find(
          (t) => t.education_level_id === l.education_level_id && t.student_count === participants.length
        );
        if (tier) totalForLesson = Number(tier.total_price) * Number(l.hours || 1);
      }
      if (totalForLesson > 0) grpAll += totalForLesson / participants.length;
    });
    const totalDueFromLessons = indAll + grpAll;

    const summary = summaryByStudent.get(selectedStudentId);
    const totalPaid = summary?.totalPaid ?? paymentsByStudent[selectedStudentId] ?? 0;
    const totalDue = parseFloat(totalDueFromLessons.toFixed(2));
    const remaining = parseFloat((totalDueFromLessons - totalPaid).toFixed(2));

    const totalIndividualCount = rows.filter(
      (r) => r.type === 'individual' || r.type === 'special_individual'
    ).length;
    const totalGroupCount = rows.filter(
      (r) => r.type === 'group' || r.type === 'special_group'
    ).length;
    const totalRemedialCount = rows.filter((r) => r.type === 'remedial').length;
    const totalSpecialCount = rows.filter(
      (r) => r.type === 'special_individual' || r.type === 'special_group'
    ).length;

    const individualOnlyCount = rows.filter((r) => r.type === 'individual').length;
    const individualOnlyHours = rows
      .filter((r) => r.type === 'individual')
      .reduce((s, r) => s + r.hours, 0);
    const individualOnlyDue = rows
      .filter((r) => r.type === 'individual')
      .reduce((s, r) => s + r.cost, 0);

    const groupOnlyCount = rows.filter((r) => r.type === 'group').length;
    const groupOnlyHours = rows
      .filter((r) => r.type === 'group')
      .reduce((s, r) => s + r.hours, 0);
    const groupOnlyDue = rows
      .filter((r) => r.type === 'group')
      .reduce((s, r) => s + r.cost, 0);

    const specialOnlyHours = rows
      .filter((r) => r.type === 'special_individual' || r.type === 'special_group')
      .reduce((s, r) => s + r.hours, 0);

    const specialBySubject = Array.from(specialBySubjectMap.entries())
      .map(([name, v]) => ({
        name,
        lessons: v.lessons,
        hours: parseFloat(v.hours.toFixed(2)),
        amount: parseFloat(v.amount.toFixed(2)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    return {
      studentName,
      levelName,
      rows: rows.sort((a, b) => b.date.localeCompare(a.date)),
      individualDue: parseFloat(individualDue.toFixed(2)),
      groupDue: parseFloat(groupDue.toFixed(2)),
      remedialDue: parseFloat(remedialDue.toFixed(2)),
      specialDue: parseFloat(specialDue.toFixed(2)),
      totalForMonth: parseFloat(totalForMonth.toFixed(2)),
      totalDue,
      totalPaid: parseFloat(Number(totalPaid).toFixed(2)),
      remaining,
      totalIndividualCount,
      totalGroupCount,
      totalRemedialCount,
      totalSpecialCount,
      specialBySubject,
      individualOnlyCount,
      individualOnlyHours: parseFloat(individualOnlyHours.toFixed(2)),
      individualOnlyDue: parseFloat(individualOnlyDue.toFixed(2)),
      groupOnlyCount,
      groupOnlyHours: parseFloat(groupOnlyHours.toFixed(2)),
      groupOnlyDue: parseFloat(groupOnlyDue.toFixed(2)),
      specialOnlyHours: parseFloat(specialOnlyHours.toFixed(2)),
    };
  }, [selectedStudentId, selectedStudentLessons, selectedMonthKey, groupPricingTiers, summaryByStudent, paymentsByStudent]);

  if (!isAdmin) {
    return (
      <div dir="rtl" className="p-6">
        <p className="text-gray-600">هذه الصفحة للمدير فقط.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl" className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
        <p className="text-gray-600 mt-1">مستحقات الطلاب حسب الشهر مع تفاصيل الدروس والإحصائيات</p>
      </div>

      <Card title="قائمة الطلاب" variant="elevated">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Input
            placeholder="ابحث باسم الطالب"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select
            value={educationLevelId}
            onChange={(e) => setEducationLevelId(e.target.value)}
            options={[
              { value: '', label: 'جميع المستويات' },
              ...educationLevels.map((l) => ({ value: l.id.toString(), label: l.name_ar })),
            ]}
            className="w-48"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-right py-2 px-3 border-b">الطالب</th>
                <th className="text-right py-2 px-3 border-b">المستوى</th>
                <th className="text-right py-2 px-3 border-b">المستحق</th>
                <th className="text-right py-2 px-3 border-b">المدفوع</th>
                <th className="text-right py-2 px-3 border-b">المتبقي</th>
                <th className="text-right py-2 px-3 border-b">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => {
                const sum = summaryByStudent.get(student.id);
                return (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{student.full_name}</td>
                    <td className="py-2 px-3">{student.education_level?.name_ar ?? '—'}</td>
                    <td className="py-2 px-3">{sum ? formatCurrency(sum.totalDue) : '—'}</td>
                    <td className="py-2 px-3">{sum ? formatCurrency(sum.totalPaid) : '—'}</td>
                    <td className="py-2 px-3">
                      {sum && (
                        <span className={sum.remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                          {formatCurrency(sum.remaining)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Button size="sm" variant="secondary" onClick={() => openStudentDetail(student.id)}>
                        كيف تم الحساب
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <p className="text-center py-6 text-gray-500">لا يوجد طلاب يطابقون البحث.</p>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <span className="text-gray-700 px-2">
              صفحة {currentPage} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
        )}
      </Card>

      {selectedStudentId != null && (
        <Card
          title={breakdownForMonth ? `كيف تم الحساب - ${breakdownForMonth.studentName}` : 'كيف تم الحساب'}
          variant="elevated"
          className="w-full !max-w-none"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="w-52">
              <Select
                label="الشهر"
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                options={monthOptions}
              />
            </div>
            <Button variant="secondary" onClick={() => { setSelectedStudentId(null); setSelectedStudentLessons(null); setCollapsedMonths({}); }}>
              إغلاق
            </Button>
          </div>
          {detailLoading ? (
            <p className="text-gray-500">جاري التحميل...</p>
          ) : !breakdownForMonth ? (
            <p className="text-gray-500">لا توجد بيانات.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                <strong>المستوى:</strong> {breakdownForMonth.levelName}
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-700">النوع</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-700">التاريخ</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-700">الساعات</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-700">المبلغ</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-700">المعلم</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-700">ملاحظة</th>
                    </tr>
                  </thead>
                  {(() => {
                    const byMonth = new Map<string, CalculationRow[]>();
                    breakdownForMonth.rows.forEach((row) => {
                      const key = row.date.slice(0, 7);
                      if (!byMonth.has(key)) byMonth.set(key, []);
                      byMonth.get(key)!.push(row);
                    });
                    const sortedMonths = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));
                    return sortedMonths.map((monthKey, groupIndex) => {
                      const rows = byMonth.get(monthKey)!;
                      const [y, m] = monthKey.split('-');
                      const monthLabel = `${monthNames[parseInt(m, 10) - 1]} ${y}`;
                      const colorClass = monthBlockColors[groupIndex % monthBlockColors.length];
                      const isCollapsed = collapsedMonths[monthKey] === true;
                      const monthTotal = rows.reduce((sum, r) => sum + r.cost, 0);
                      const indRows = rows.filter((r) => r.type === 'individual');
                      const grpRows = rows.filter((r) => r.type === 'group');
                      const remRows = rows.filter((r) => r.type === 'remedial');
                      const specialRows = rows.filter(
                        (r) => r.type === 'special_individual' || r.type === 'special_group'
                      );
                      const indHours = indRows.reduce((s, r) => s + r.hours, 0);
                      const grpHours = grpRows.reduce((s, r) => s + r.hours, 0);
                      const remHours = remRows.reduce((s, r) => s + r.hours, 0);
                      const specialHours = specialRows.reduce((s, r) => s + r.hours, 0);
                      return (
                        <tbody key={monthKey} className={colorClass}>
                          <tr className="border-t-2 border-gray-300">
                            <td colSpan={6} className="py-2 px-3 text-right font-bold text-gray-800">
                              <button
                                type="button"
                                onClick={() =>
                                  setCollapsedMonths((prev) => ({
                                    ...prev,
                                    [monthKey]: !prev[monthKey],
                                  }))
                                }
                                className="w-full flex items-center justify-between gap-3 text-right"
                              >
                                <span>
                                  <span className="ml-2">{isCollapsed ? '▶' : '▼'}</span>
                                  <span>📅 {monthLabel}</span>
                                  <span className="mr-2 text-sm font-normal text-gray-600">
                                    ({rows.length} درس — {monthTotal.toFixed(2)} ₪)
                                  </span>
                                </span>
                                <span className="text-xs font-normal text-gray-500">
                                  {isCollapsed ? 'فتح' : 'إغلاق'}
                                </span>
                              </button>
                            </td>
                          </tr>
                          {!isCollapsed && rows.map((row, i) => (
                            <tr key={`${monthKey}-${i}`} className="border-t border-gray-200/80 hover:bg-white/50">
                              <td className="py-2 px-3">{row.typeLabel}</td>
                              <td className="py-2 px-3">{row.date}</td>
                              <td className="py-2 px-3">{row.hours}</td>
                              <td className="py-2 px-3 font-medium">{row.cost.toFixed(2)} ₪</td>
                              <td className="py-2 px-3">{row.teacherName ?? '-'}</td>
                              <td className="py-2 px-3 text-gray-500">{row.note ?? '-'}</td>
                            </tr>
                          ))}
                          {!isCollapsed && (
                            <tr className="border-t-2 border-gray-400 bg-black/5">
                              <td colSpan={6} className="py-3 px-3 text-sm">
                                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-1 text-center">
                                  <span><strong>الدروس:</strong> {indRows.length} فردي، {grpRows.length} جماعي، {remRows.length} علاجي، {specialRows.length} خاص</span>
                                  <span><strong>الساعات:</strong> {indHours.toFixed(2)} فردي، {grpHours.toFixed(2)} جماعي، {remHours.toFixed(2)} علاجي، {specialHours.toFixed(2)} خاص</span>
                                  <span><strong>تكلفة الشهر:</strong> {monthTotal.toFixed(2)} ₪</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      );
                    });
                  })()}
                </table>
              </div>
              <div className="border-t pt-6 mt-6">
                <p className="text-lg font-bold text-gray-800 mb-4">إحصائيات (الشهر المختار)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 min-h-[140px]">
                    <p className="text-base font-bold text-blue-800 mb-3">فردي</p>
                    <p className="text-base">{breakdownForMonth.individualOnlyCount} درس</p>
                    <p className="text-xl font-bold text-blue-900 mt-1">{breakdownForMonth.individualOnlyHours.toFixed(2)} ساعة</p>
                    <p className="text-base font-semibold mt-3">{breakdownForMonth.individualOnlyDue.toFixed(2)} ₪</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 min-h-[140px]">
                    <p className="text-base font-bold text-emerald-800 mb-3">جماعي</p>
                    <p className="text-base">{breakdownForMonth.groupOnlyCount} درس</p>
                    <p className="text-xl font-bold text-emerald-900 mt-1">{breakdownForMonth.groupOnlyHours.toFixed(2)} ساعة</p>
                    <p className="text-base font-semibold mt-3">{breakdownForMonth.groupOnlyDue.toFixed(2)} ₪</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-5 border border-violet-200 min-h-[140px]">
                    <p className="text-base font-bold text-violet-800 mb-3">خاص</p>
                    {breakdownForMonth.specialBySubject.length === 0 ? (
                      <>
                        <p className="text-base">0 درس</p>
                        <p className="text-xl font-bold text-violet-900 mt-1">0.00 ساعة</p>
                        <p className="text-base font-semibold mt-3">0.00 ₪</p>
                      </>
                    ) : (
                      <>
                        <ul className="space-y-1.5 text-base mb-2">
                          {breakdownForMonth.specialBySubject.map((s) => (
                            <li key={s.name}>
                              <span className="font-medium">{s.name}:</span> {s.lessons} درس، {s.amount.toFixed(2)} ₪
                            </li>
                          ))}
                        </ul>
                        <p className="text-xl font-bold text-violet-900 mt-2">{breakdownForMonth.specialOnlyHours.toFixed(2)} ساعة</p>
                        <p className="text-base font-semibold mt-2">{breakdownForMonth.specialDue.toFixed(2)} ₪</p>
                      </>
                    )}
                  </div>
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 min-h-[140px]">
                    <p className="text-base font-bold text-amber-800 mb-3">الدفع</p>
                    <p className="text-base">تكلفة الشهر: <span className="font-semibold">{breakdownForMonth.totalForMonth.toFixed(2)} ₪</span></p>
                    <p className="text-base mt-2">إجمالي المستحق: <span className="font-semibold">{breakdownForMonth.totalDue.toFixed(2)} ₪</span></p>
                    <p className="text-base mt-1">المدفوع: <span className="font-semibold">{breakdownForMonth.totalPaid.toFixed(2)} ₪</span></p>
                    <p className={`text-base font-bold mt-3 ${breakdownForMonth.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      المتبقي: {breakdownForMonth.remaining.toFixed(2)} ₪
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
