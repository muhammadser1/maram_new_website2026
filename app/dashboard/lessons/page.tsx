'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ComboBox } from '@/components/ui/ComboBox';
import { TimePicker } from '@/components/ui/TimePicker';
import { Modal } from '@/components/ui/Modal';
import {
  IndividualLesson,
  GroupLesson,
  Student,
  EducationLevel,
  Teacher,
  Subject,
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  LESSON_SUBMISSION_DEADLINE_DAY,
  isLessonDateWithinSubmissionWindow,
  getLessonSubmissionDeadlineMessage,
  type LessonDeadlineConfig,
} from '@/lib/utils/lesson-submission-deadline';

type LessonTab = 'individual' | 'group';

const statusOptions = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'approved', label: 'معتمد' },
  { value: 'deleted', label: 'محذوف' },
];
const SPECIAL_LESSON_LABEL =
  '(فيزياء، حاسوب، הוראה מתקנת)';

export default function LessonsPage() {
  const router = useRouter();
  const { isTeacher, isAdmin, teacher } = useAuth();
  const canCreateLessons = isTeacher;
  const canApproveLessons = isAdmin;
  const [teachersCanAddStudents, setTeachersCanAddStudents] = useState(true);
  const [lessonSubmissionDeadlineDay, setLessonSubmissionDeadlineDay] = useState<number | null>(null);
  const [lessonSubmissionDeadlineInclusive, setLessonSubmissionDeadlineInclusive] = useState<boolean | null>(null);

  const today = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const lessonDeadlineConfig: LessonDeadlineConfig = useMemo(
    () => ({
      deadlineDay: lessonSubmissionDeadlineDay ?? LESSON_SUBMISSION_DEADLINE_DAY,
      deadlineInclusive: lessonSubmissionDeadlineInclusive ?? true,
    }),
    [lessonSubmissionDeadlineDay, lessonSubmissionDeadlineInclusive]
  );

  const [activeTab, setActiveTab] = useState<LessonTab>('individual');
  const [loading, setLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState('');

  const [individualLessons, setIndividualLessons] = useState<
    IndividualLesson[]
  >([]);
  const [groupLessons, setGroupLessons] = useState<GroupLesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [individualFilters, setIndividualFilters] = useState({
    search: '',
    status: 'all',
  });
  const [groupFilters, setGroupFilters] = useState({
    search: '',
    status: 'all',
  });
  const [individualFormOpen, setIndividualFormOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [individualEditing, setIndividualEditing] =
    useState<IndividualLesson | null>(null);
  const [groupEditing, setGroupEditing] = useState<GroupLesson | null>(null);

  const [individualFormError, setIndividualFormError] = useState('');
  const [groupFormError, setGroupFormError] = useState('');
  const [individualSubmitting, setIndividualSubmitting] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [bulkApprovingIndividual, setBulkApprovingIndividual] = useState(false);
  const [bulkApprovingGroup, setBulkApprovingGroup] = useState(false);

  // Respect admin setting: whether teachers are allowed to add students
  useEffect(() => {
    if (isTeacher && !isAdmin) {
      api
        .getSettings()
        .then((response) => {
          if (response.success && response.data) {
            const settings = response.data as {
              teachers_can_add_students?: boolean;
              lesson_submission_deadline_day?: string | number;
              lesson_submission_deadline_inclusive?: boolean | string;
            };
            setTeachersCanAddStudents(settings.teachers_can_add_students ?? true);
            const day = settings.lesson_submission_deadline_day;
            const n = typeof day === 'string' ? parseInt(day, 10) : day;
            if (n != null && Number.isFinite(n) && n >= 1 && n <= 31) setLessonSubmissionDeadlineDay(n);
            const inc = settings.lesson_submission_deadline_inclusive;
            setLessonSubmissionDeadlineInclusive(inc === true || inc === 'true');
          }
        })
        .catch(() => {
          // Default to true on error to avoid blocking
          setTeachersCanAddStudents(true);
        });
    } else {
      // Admins can always add students
      setTeachersCanAddStudents(true);
    }
  }, [isTeacher, isAdmin]);

  // Student modal state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    first_name: '',
    last_name: '',
    education_level_id: '',
    class: '',
  });
  const [studentFormError, setStudentFormError] = useState('');
  const [studentFieldErrors, setStudentFieldErrors] = useState<{
    first_name?: string;
    last_name?: string;
    education_level_id?: string;
    class?: string;
  }>({});
  const [studentSubmitting, setStudentSubmitting] = useState(false);

  const getStudentClassOptionsForLevel = (levelId: string) => {
    const level = educationLevels.find((l) => l.id.toString() === levelId);
    const name = level?.name_ar?.trim() || '';

    if (name === 'ابتدائي') {
      return ['أول', 'ثاني', 'ثالث', 'رابع', 'خامس', 'سادس'];
    }
    if (name === 'إعدادي') {
      return ['سابع', 'ثامن', 'تاسع'];
    }
    if (name === 'ثانوي') {
      return ['عاشر', 'حادي عشر', 'ثاني عشر'];
    }
    if (name === 'جامعي') {
      return ['جامعي', 'بعد الثانوي'];
    }
    return ['أول','ثاني','ثالث','رابع','خامس','سادس','سابع','ثامن','تاسع','عاشر'];
  };

  const isRemedialSubject = (subject: Subject) => {
    const name = subject.name_ar || '';
    return name.includes('علاجية') || name.includes('הוראה');
  };

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<{
    type: 'individual' | 'group';
    lesson: IndividualLesson | GroupLesson;
  } | null>(null);
  const [deletionNote, setDeletionNote] = useState('');
  const [deleting, setDeleting] = useState(false);

  const ITEMS_PER_PAGE = 15;
  const [individualPage, setIndividualPage] = useState(1);
  const [groupPage, setGroupPage] = useState(1);

  const [individualForm, setIndividualForm] = useState({
    teacher_id: teacher?.id ? teacher.id.toString() : '',
    student_id: '',
    education_level_id: '',
    lesson_type: 'regular' as 'regular' | 'special',
    subject_id: '',
    date: today,
    start_time: '',
    hours: '1',
  });

  const [groupForm, setGroupForm] = useState({
    teacher_id: teacher?.id ? teacher.id.toString() : '',
    education_level_id: '',
    lesson_type: 'regular' as 'regular' | 'special',
    subject_id: '',
    date: today,
    start_time: '',
    hours: '1',
    studentIds: [] as number[],
    search: '',
  });

  const lessonYears = [2025, 2026];
  const lessonMonths = [
    { value: 'all', label: 'جميع الأشهر' },
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
  const [selectedYear, setSelectedYear] = useState(
    lessonYears.includes(currentYear) ? currentYear : lessonYears[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const getDateFilters = (year: number, month: string) => {
    // "all" = all months of the selected year (not all years)
    if (month === 'all') {
      return {
        date_from: `${year}-01-01`,
        date_to: `${year}-12-31`,
      };
    }
    const monthNum = Number(month);
    // Format dates as YYYY-MM-DD without timezone conversion
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    // Get last day of month
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return {
      date_from: startDate,
      date_to: endDate,
    };
  };

  const mergeUniqueById = <T extends { id: number }>(items: T[]) => {
    const seen = new Set<number>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const loadIndividualLessonsByStatus = async (
    status: string,
    dateFilters: { date_from: string; date_to: string }
  ) => {
    if (status === 'all') {
      const [activeRes, deletedRes] = await Promise.all([
        api.getIndividualLessons(dateFilters),
        api.getIndividualLessons({ ...dateFilters, show_deleted: 'true' }),
      ]);
      if (!activeRes.success) return activeRes;
      if (!deletedRes.success) return deletedRes;
      return {
        success: true,
        data: mergeUniqueById([
          ...((activeRes.data as IndividualLesson[]) || []),
          ...((deletedRes.data as IndividualLesson[]) || []),
        ]),
      };
    }

    return api.getIndividualLessons({
      ...dateFilters,
      ...(status === 'deleted' && { show_deleted: 'true' }),
    });
  };

  const loadGroupLessonsByStatus = async (
    status: string,
    dateFilters: { date_from: string; date_to: string }
  ) => {
    if (status === 'all') {
      const [activeRes, deletedRes] = await Promise.all([
        api.getGroupLessons(dateFilters),
        api.getGroupLessons({ ...dateFilters, show_deleted: 'true' }),
      ]);
      if (!activeRes.success) return activeRes;
      if (!deletedRes.success) return deletedRes;
      return {
        success: true,
        data: mergeUniqueById([
          ...((activeRes.data as GroupLesson[]) || []),
          ...((deletedRes.data as GroupLesson[]) || []),
        ]),
      };
    }

    return api.getGroupLessons({
      ...dateFilters,
      ...(status === 'deleted' && { show_deleted: 'true' }),
    });
  };

  useEffect(() => {
    if (teacher) {
          setIndividualForm((prev) => ({
            ...prev,
            teacher_id: teacher.id.toString(),
          }));
          setGroupForm((prev) => ({
            ...prev,
            teacher_id: teacher.id.toString(),
          }));
    }
  }, [teacher]);

  useEffect(() => {
    if (!isTeacher && teachers.length > 0) {
      setIndividualForm((prev) => ({
        ...prev,
        teacher_id: prev.teacher_id || teachers[0].id.toString(),
      }));
      setGroupForm((prev) => ({
        ...prev,
        teacher_id: prev.teacher_id || teachers[0].id.toString(),
      }));
    }
  }, [teachers, isTeacher]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setLessonsError('');
    try {
      const dateFilters = getDateFilters(selectedYear, selectedMonth);
      const promises: Promise<any>[] = [
        loadIndividualLessonsByStatus(individualFilters.status, dateFilters),
        loadGroupLessonsByStatus(groupFilters.status, dateFilters),
        api.getStudents(),
        api.getEducationLevels(),
        api.getSubjects(),
      ];

      const [individualRes, groupRes, studentsRes, levelsRes, subjectsRes] =
        await Promise.all(promises);

      if (individualRes.success && Array.isArray(individualRes.data)) {
        setIndividualLessons(individualRes.data as IndividualLesson[]);
      } else {
        setLessonsError(
          individualRes.error || 'فشل تحميل الدروس الفردية'
        );
      }

      if (groupRes.success && Array.isArray(groupRes.data)) {
        setGroupLessons(groupRes.data as GroupLesson[]);
      } else {
        setLessonsError(groupRes.error || 'فشل تحميل الدروس الجماعية');
      }

      if (studentsRes.success && Array.isArray(studentsRes.data)) {
        setStudents(studentsRes.data as Student[]);
      }

      if (levelsRes.success && Array.isArray(levelsRes.data)) {
        setEducationLevels(levelsRes.data as EducationLevel[]);
      }

      if (subjectsRes?.success && Array.isArray(subjectsRes.data)) {
        setSubjects(subjectsRes.data as Subject[]);
      }

      if (isAdmin) {
        const teachersRes = await api.getTeachers();
        if (teachersRes.success && Array.isArray(teachersRes.data)) {
          setTeachers(teachersRes.data as Teacher[]);
        } else {
          setTeachers([]);
        }
      } else if (teacher) {
        setTeachers([teacher]);
      }
    } catch (error: any) {
      setLessonsError(error.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, teacher, selectedYear, selectedMonth, individualFilters.status, groupFilters.status]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Reload education levels when individual form opens to ensure fresh data
  useEffect(() => {
    if (individualFormOpen && educationLevels.length > 0) {
      const refreshLevels = async () => {
        try {
          const levelsRes = await api.getEducationLevels();
          if (levelsRes.success && Array.isArray(levelsRes.data)) {
            setEducationLevels(levelsRes.data as EducationLevel[]);
          }
        } catch (error) {
          console.error('Error refreshing education levels:', error);
        }
      };
      refreshLevels();
    }
  }, [individualFormOpen]);

  const refreshStudents = async () => {
    try {
      const studentsRes = await api.getStudents();
      if (studentsRes.success && Array.isArray(studentsRes.data)) {
        setStudents(studentsRes.data as Student[]);
      }
    } catch (error) {
      console.error('Error refreshing students:', error);
    }
  };

  const refreshLessons = async () => {
    try {
      const dateFilters = getDateFilters(selectedYear, selectedMonth);
      const [individualRes, groupRes] = await Promise.all([
        loadIndividualLessonsByStatus(individualFilters.status, dateFilters),
        loadGroupLessonsByStatus(groupFilters.status, dateFilters),
      ]);
      if (individualRes.success && Array.isArray(individualRes.data)) {
        setIndividualLessons(individualRes.data as IndividualLesson[]);
      }
      if (groupRes.success && Array.isArray(groupRes.data)) {
        setGroupLessons(groupRes.data as GroupLesson[]);
      }
    } catch (error) {
      console.error('Refresh lessons error:', error);
    }
  };

  const resetStudentForm = () => {
    setStudentFormData({ first_name: '', last_name: '', education_level_id: '', class: '' });
    setStudentFormError('');
    setStudentFieldErrors({});
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError('');
    setStudentFieldErrors({});
    setStudentSubmitting(true);

    if (!studentFormData.first_name?.trim()) {
      setStudentFieldErrors({ first_name: 'الاسم الأول مطلوب' });
      setStudentSubmitting(false);
      return;
    }
    if (!studentFormData.last_name?.trim()) {
      setStudentFieldErrors({ last_name: 'اسم العائلة مطلوب' });
      setStudentSubmitting(false);
      return;
    }

    if (!studentFormData.education_level_id) {
      setStudentFieldErrors({ education_level_id: 'يرجى اختيار المستوى التعليمي' });
      setStudentSubmitting(false);
      return;
    }

    if (!studentFormData.class?.trim()) {
      setStudentFieldErrors({ class: 'يرجى اختيار الصف' });
      setStudentSubmitting(false);
      return;
    }

    try {
      const fullName = `${studentFormData.first_name.trim()} ${studentFormData.last_name.trim()}`;
      const submitData = {
        full_name: fullName,
        parent_contact: null,
        education_level_id: studentFormData.education_level_id ? parseInt(studentFormData.education_level_id) : null,
        class: studentFormData.class.trim(),
      };

      const response = await api.createStudent(submitData);
      if (response.success) {
        await refreshStudents();
        resetStudentForm();
        setStudentModalOpen(false);
      } else {
        if (response.error?.includes('الطالب موجود')) {
          setStudentFieldErrors({ first_name: 'الطالب موجود مسبقًا' });
        } else if (response.error?.includes('المستوى')) {
          setStudentFieldErrors({ education_level_id: response.error });
        } else if (response.error?.includes('الهاتف')) {
          setStudentFormError(response.error);
        } else {
          setStudentFormError(response.error || 'فشل إضافة الطالب');
        }
      }
    } catch (err: any) {
      setStudentFormError(err.message || 'حدث خطأ');
    } finally {
      setStudentSubmitting(false);
    }
  };

  const filteredIndividualLessons = useMemo(() => {
    return individualLessons.filter((lesson) => {
      const searchLower = individualFilters.search.toLowerCase();
      const matchesSearch = individualFilters.search
        ? lesson.student?.full_name
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.teacher?.full_name
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.education_level?.name_ar
            ?.toLowerCase()
            .includes(searchLower) ||
          lesson.date.includes(individualFilters.search)
        : true;
      const matchesStatus =
        individualFilters.status === 'all' ||
        (individualFilters.status === 'pending' && !lesson.approved && !lesson.deleted_at) ||
        (individualFilters.status === 'approved' && lesson.approved && !lesson.deleted_at) ||
        (individualFilters.status === 'deleted' && !!lesson.deleted_at);
      return matchesSearch && matchesStatus;
    });
  }, [individualLessons, individualFilters]);

  const filteredGroupLessons = useMemo(() => {
    return groupLessons.filter((lesson) => {
      const search = groupFilters.search.toLowerCase();
      const matchesSearch = groupFilters.search
        ? lesson.students?.some((student) =>
            student.full_name.toLowerCase().includes(search)
          ) ||
          lesson.teacher?.full_name
            ?.toLowerCase()
            .includes(search) ||
          lesson.education_level?.name_ar
            ?.toLowerCase()
            .includes(search) ||
          lesson.date.includes(groupFilters.search)
        : true;
      const matchesStatus =
        groupFilters.status === 'all' ||
        (groupFilters.status === 'pending' && !lesson.approved && !lesson.deleted_at) ||
        (groupFilters.status === 'approved' && lesson.approved && !lesson.deleted_at) ||
        (groupFilters.status === 'deleted' && !!lesson.deleted_at);
      return matchesSearch && matchesStatus;
    });
  }, [groupLessons, groupFilters]);

  // Filtered pending lessons - only the ones currently visible/filtered
  const filteredPendingIndividualLessons = useMemo(
    () => filteredIndividualLessons.filter((lesson) => !lesson.approved && !lesson.deleted_at),
    [filteredIndividualLessons]
  );

  const filteredPendingGroupLessons = useMemo(
    () => filteredGroupLessons.filter((lesson) => !lesson.approved && !lesson.deleted_at),
    [filteredGroupLessons]
  );

  const handleOpenIndividualForm = (lesson?: IndividualLesson) => {
    if (!canCreateLessons) return;
    if (lesson) {
      // Prevent editing deleted lessons
      if (lesson.deleted_at) {
        alert('لا يمكن تعديل درس محذوف');
        return;
      }
      setIndividualEditing(lesson);
      setIndividualForm({
        teacher_id:
          lesson.teacher_id?.toString() || teacher?.id?.toString() || '',
        student_id: lesson.student_id.toString(),
        education_level_id: lesson.education_level_id.toString(),
        lesson_type: lesson.subject_id ? 'special' : 'regular',
        subject_id: lesson.subject_id?.toString() ?? '',
        date: lesson.date,
        start_time: lesson.start_time || '',
        hours: lesson.hours.toString(),
      });
    } else {
      setIndividualEditing(null);
      setIndividualForm({
        teacher_id: teacher?.id ? teacher.id.toString() : '',
        student_id: '',
        education_level_id: '',
        lesson_type: 'regular',
        subject_id: '',
        date: today,
        start_time: '',
        hours: '1',
      });
    }
    setIndividualFormError('');
    setIndividualFormOpen(true);
    setActiveTab('individual');
  };

  const handleOpenGroupForm = (lesson?: GroupLesson) => {
    if (!canCreateLessons) return;
    if (lesson) {
      // Prevent editing deleted lessons
      if (lesson.deleted_at) {
        alert('لا يمكن تعديل درس محذوف');
        return;
      }
      setGroupEditing(lesson);
      setGroupForm({
        teacher_id:
          lesson.teacher_id?.toString() || teacher?.id?.toString() || '',
        education_level_id: lesson.education_level_id.toString(),
        lesson_type: lesson.subject_id ? 'special' : 'regular',
        subject_id: lesson.subject_id?.toString() ?? '',
        date: lesson.date,
        start_time: lesson.start_time || '',
        hours: lesson.hours.toString(),
        studentIds: lesson.students?.map((s) => s.id) || [],
        search: '',
      });
    } else {
      setGroupEditing(null);
      setGroupForm({
        teacher_id: teacher?.id ? teacher.id.toString() : '',
        education_level_id: '',
        lesson_type: 'regular',
        subject_id: '',
        date: today,
        start_time: '',
        hours: '1',
        studentIds: [],
        search: '',
      });
    }
    setGroupFormError('');
    setGroupFormOpen(true);
    setActiveTab('group');
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateLessons) return;

    setIndividualFormError('');

    if (!teacher && !individualForm.teacher_id) {
      setIndividualFormError('يرجى اختيار المعلم');
      return;
    }

    if (!individualForm.student_id) {
      setIndividualFormError('يرجى اختيار الطالب');
      return;
    }

    if (!individualForm.education_level_id) {
      setIndividualFormError('يرجى اختيار المستوى التعليمي');
      return;
    }

    if (individualForm.lesson_type === 'special' && !individualForm.subject_id) {
      setIndividualFormError('يرجى اختيار المادة للدرس الخاص');
      return;
    }

    if (!individualForm.date) {
      setIndividualFormError('يرجى اختيار تاريخ الدرس');
      return;
    }

    if (isTeacher && !individualEditing && !isLessonDateWithinSubmissionWindow(individualForm.date, new Date(), lessonDeadlineConfig)) {
      setIndividualFormError(getLessonSubmissionDeadlineMessage(lessonDeadlineConfig));
      return;
    }

    if (!individualForm.start_time || !individualForm.start_time.trim()) {
      setIndividualFormError('يرجى اختيار وقت بداية الدرس');
      return;
    }

    if (!individualForm.hours) {
      setIndividualFormError('يرجى تحديد عدد الساعات');
      return;
    }

    const teacherId = teacher
      ? teacher.id
      : individualForm.teacher_id
      ? parseInt(individualForm.teacher_id, 10)
      : null;

    if (!teacherId) {
      setIndividualFormError('يرجى اختيار المعلم');
      return;
    }

    setIndividualSubmitting(true);

      const payload = {
        teacher_id: teacherId,
        student_id: parseInt(individualForm.student_id, 10),
        education_level_id: parseInt(individualForm.education_level_id, 10),
        subject_id: individualForm.lesson_type === 'special' && individualForm.subject_id
          ? parseInt(individualForm.subject_id, 10)
          : null,
        date: individualForm.date,
        start_time: individualForm.start_time,
        hours: parseFloat(individualForm.hours),
      };

    try {
      let response;
      if (individualEditing) {
        response = await api.updateIndividualLesson(
          individualEditing.id,
          payload
        );
      } else {
        response = await api.createIndividualLesson(payload);
      }

      if (!response.success) {
        setIndividualFormError(response.error || 'فشل حفظ الدرس');
        return;
      }

      await refreshLessons();
      setIndividualFormOpen(false);
      setIndividualEditing(null);
    } catch (error: any) {
      setIndividualFormError(error.message || 'حدث خطأ أثناء حفظ الدرس');
    } finally {
      setIndividualSubmitting(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateLessons) return;

    setGroupFormError('');

    if (!teacher && !groupForm.teacher_id) {
      setGroupFormError('يرجى اختيار المعلم');
      return;
    }

    if (!groupForm.education_level_id) {
      setGroupFormError('يرجى اختيار المستوى التعليمي');
      return;
    }

    if (groupForm.lesson_type === 'special' && !groupForm.subject_id) {
      setGroupFormError('يرجى اختيار المادة للدرس الخاص');
      return;
    }

    if (!groupForm.date) {
      setGroupFormError('يرجى اختيار تاريخ الدرس');
      return;
    }

    if (isTeacher && !groupEditing && !isLessonDateWithinSubmissionWindow(groupForm.date, new Date(), lessonDeadlineConfig)) {
      setGroupFormError(getLessonSubmissionDeadlineMessage(lessonDeadlineConfig));
      return;
    }

    if (!groupForm.start_time || !groupForm.start_time.trim()) {
      setGroupFormError('يرجى اختيار وقت بداية الدرس');
      return;
    }

    if (!groupForm.hours) {
      setGroupFormError('يرجى تحديد عدد الساعات');
      return;
    }

    if (groupForm.studentIds.length < 2) {
      setGroupFormError('يجب اختيار طالبين على الأقل');
      return;
    }

    const teacherId = teacher
      ? teacher.id
      : groupForm.teacher_id
      ? parseInt(groupForm.teacher_id, 10)
      : null;

    if (!teacherId) {
      setGroupFormError('يرجى اختيار المعلم');
      return;
    }

    setGroupSubmitting(true);

    const payload = {
      teacher_id: teacherId,
      education_level_id: parseInt(groupForm.education_level_id, 10),
      subject_id: groupForm.lesson_type === 'special' && groupForm.subject_id
        ? parseInt(groupForm.subject_id, 10)
        : null,
      date: groupForm.date,
      start_time: groupForm.start_time,
      hours: parseFloat(groupForm.hours),
      student_ids: groupForm.studentIds,
    };

    try {
      let response;
      if (groupEditing) {
        response = await api.updateGroupLesson(groupEditing.id, payload);
      } else {
        response = await api.createGroupLesson(payload);
      }

      if (!response.success) {
        setGroupFormError(response.error || 'فشل حفظ الدرس');
        return;
      }

      await refreshLessons();
      setGroupFormOpen(false);
      setGroupEditing(null);
    } catch (error: any) {
      setGroupFormError(error.message || 'حدث خطأ أثناء حفظ الدرس');
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleDeleteIndividual = (lesson: IndividualLesson) => {
    if (!isTeacher && !isAdmin) return;
    if (lesson.approved && !isAdmin) return;
    setLessonToDelete({ type: 'individual', lesson });
    setDeletionNote('');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    
    setDeleting(true);
    try {
      const note = isAdmin ? (deletionNote.trim() || undefined) : undefined;
      let response;
      
      if (lessonToDelete.type === 'individual') {
        response = await api.deleteIndividualLesson((lessonToDelete.lesson as IndividualLesson).id, note);
      } else {
        response = await api.deleteGroupLesson((lessonToDelete.lesson as GroupLesson).id, note);
      }
      
      if (!response.success) {
        alert(response.error || 'فشل حذف الدرس');
        return;
      }
      
      alert('تم حذف الدرس بنجاح');
      setDeleteModalOpen(false);
      setLessonToDelete(null);
      setDeletionNote('');
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف الدرس');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteGroup = (lesson: GroupLesson) => {
    if (!isTeacher && !isAdmin) return;
    if (lesson.approved && !isAdmin) return;
    setLessonToDelete({ type: 'group', lesson });
    setDeletionNote('');
    setDeleteModalOpen(true);
  };

  const handleApproveIndividual = async (lesson: IndividualLesson) => {
    if (!isAdmin || lesson.approved || lesson.deleted_at) return;
    try {
      const response = await api.approveIndividualLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل اعتماد الدرس');
        return;
      }
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدرس');
    }
  };

  const handleApproveGroup = async (lesson: GroupLesson) => {
    if (!isAdmin || lesson.approved || lesson.deleted_at) return;
    try {
      const response = await api.approveGroupLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل اعتماد الدرس');
        return;
      }
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدرس');
    }
  };

  const handleUnapproveIndividual = async (lesson: IndividualLesson) => {
    if (!isAdmin || !lesson.approved || lesson.deleted_at) return;
    if (!confirm('هل تريد إلغاء اعتماد هذا الدرس؟ يمكنك بعد ذلك تعديله أو حذفه.')) {
      return;
    }
    try {
      const response = await api.unapproveIndividualLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل إلغاء اعتماد الدرس');
        return;
      }
      alert('تم إلغاء اعتماد الدرس بنجاح. يمكنك الآن تعديله أو حذفه.');
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إلغاء اعتماد الدرس');
    }
  };

  const handleUnapproveGroup = async (lesson: GroupLesson) => {
    if (!isAdmin || !lesson.approved || lesson.deleted_at) return;
    if (!confirm('هل تريد إلغاء اعتماد هذا الدرس؟ يمكنك بعد ذلك تعديله أو حذفه.')) {
      return;
    }
    try {
      const response = await api.unapproveGroupLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل إلغاء اعتماد الدرس');
        return;
      }
      alert('تم إلغاء اعتماد الدرس بنجاح. يمكنك الآن تعديله أو حذفه.');
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء إلغاء اعتماد الدرس');
    }
  };

  const handleRestoreIndividual = async (lesson: IndividualLesson) => {
    if (!isAdmin || !lesson.deleted_at) return;
    if (!confirm('هل تريد استعادة هذا الدرس المحذوف؟')) {
      return;
    }
    try {
      const response = await api.restoreIndividualLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل استعادة الدرس');
        return;
      }
      alert('تم استعادة الدرس بنجاح');
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء استعادة الدرس');
    }
  };

  const handleRestoreGroup = async (lesson: GroupLesson) => {
    if (!isAdmin || !lesson.deleted_at) return;
    if (!confirm('هل تريد استعادة هذا الدرس المحذوف؟')) {
      return;
    }
    try {
      const response = await api.restoreGroupLesson(lesson.id);
      if (!response.success) {
        alert(response.error || 'فشل استعادة الدرس');
        return;
      }
      alert('تم استعادة الدرس بنجاح');
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء استعادة الدرس');
    }
  };

  const handleBulkApproveIndividual = async () => {
    if (!isAdmin) return;
    
    // Get only the filtered pending lessons
    const lessonsToApprove = filteredPendingIndividualLessons;
    
    if (lessonsToApprove.length === 0) {
      alert('لا توجد دروس للاعتماد في الفلترة الحالية');
      return;
    }
    
    setBulkApprovingIndividual(true);
    try {
      // Approve all filtered pending lessons
      const approvePromises = lessonsToApprove.map((lesson) =>
        api.approveIndividualLesson(lesson.id)
      );
      
      const results = await Promise.all(approvePromises);
      const failed = results.filter((r) => !r.success);
      
      if (failed.length > 0) {
        alert(`فشل اعتماد ${failed.length} من ${lessonsToApprove.length} درس`);
      } else {
        alert(`تم اعتماد ${lessonsToApprove.length} درس بنجاح`);
      }
      
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدروس');
    } finally {
      setBulkApprovingIndividual(false);
    }
  };

  const handleBulkApproveGroup = async () => {
    if (!isAdmin) return;
    
    // Get only the filtered pending lessons
    const lessonsToApprove = filteredPendingGroupLessons;
    
    if (lessonsToApprove.length === 0) {
      alert('لا توجد دروس للاعتماد في الفلترة الحالية');
      return;
    }
    
    setBulkApprovingGroup(true);
    try {
      // Approve all filtered pending lessons
      const approvePromises = lessonsToApprove.map((lesson) =>
        api.approveGroupLesson(lesson.id)
      );
      
      const results = await Promise.all(approvePromises);
      const failed = results.filter((r) => !r.success);
      
      if (failed.length > 0) {
        alert(`فشل اعتماد ${failed.length} من ${lessonsToApprove.length} درس`);
      } else {
        alert(`تم اعتماد ${lessonsToApprove.length} درس بنجاح`);
      }
      
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء اعتماد الدروس');
    } finally {
      setBulkApprovingGroup(false);
    }
  };

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'ar')
      ),
    [students]
  );

  const studentsById = useMemo(() => {
    const map = new Map<number, Student>();
    sortedStudents.forEach((student) => {
      map.set(student.id, student);
    });
    return map;
  }, [sortedStudents]);

  const individualStudentOptions = sortedStudents
    .filter((student) => {
      if (individualForm.education_level_id) {
        return (
          student.education_level_id?.toString() ===
          individualForm.education_level_id
        );
      }
      return true;
    })
    .map((student) => ({
      value: student.id,
      label: student.class 
        ? `${student.full_name} - ${student.class}` 
        : student.full_name,
    }));

  const availableGroupStudentOptions = sortedStudents
    .filter((student) => {
      if (groupForm.education_level_id) {
        if (
          student.education_level_id?.toString() !== groupForm.education_level_id
        ) {
          return false;
        }
      }
      if (groupForm.studentIds.includes(student.id)) {
        return false;
      }
      return true;
    })
    .map((student) => ({
      value: student.id,
      label: student.class 
        ? `${student.full_name} - ${student.class}` 
        : student.full_name,
    }));

  const selectedGroupStudents = groupForm.studentIds
    .map((id) => students.find((student) => student.id === id))
    .filter(Boolean) as Student[];

  const teacherSelectOptions = useMemo(
    () => [
      { value: '', label: 'اختر المعلم' },
      ...teachers.map((t) => ({
        value: t.id.toString(),
        label: t.full_name,
      })),
    ],
    [teachers]
  );

  const pendingIndividualLessons = useMemo(
    () => individualLessons.filter((lesson) => !lesson.approved && !lesson.deleted_at),
    [individualLessons]
  );

  const pendingGroupLessons = useMemo(
    () => groupLessons.filter((lesson) => !lesson.approved && !lesson.deleted_at),
    [groupLessons]
  );

  const lessonTabs: { label: string; value: LessonTab }[] = [
    { label: 'الدروس الفردية', value: 'individual' },
    { label: 'الدروس الجماعية', value: 'group' },
  ];

  const individualRowOffset = useMemo(
    () => (individualPage - 1) * ITEMS_PER_PAGE,
    [individualPage]
  );
  const groupRowOffset = useMemo(
    () => (groupPage - 1) * ITEMS_PER_PAGE,
    [groupPage]
  );

  const paginatedIndividualLessons = useMemo(() => {
    const start = individualRowOffset;
    return filteredIndividualLessons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIndividualLessons, individualRowOffset]);

  const paginatedGroupLessons = useMemo(() => {
    const start = groupRowOffset;
    return filteredGroupLessons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGroupLessons, groupRowOffset]);

  useEffect(() => {
    setIndividualPage(1);
  }, [individualFilters, selectedYear, selectedMonth]);

  useEffect(() => {
    setGroupPage(1);
  }, [groupFilters, selectedYear, selectedMonth]);

  const individualColumns: TableColumn<IndividualLesson>[] = [
    {
      key: 'index',
      header: 'الرقم',
      render: (_lesson, index = 0) => individualRowOffset + index + 1,
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (lesson: IndividualLesson) => lesson.date,
    },
    {
      key: 'start_time',
      header: 'وقت البدء',
      render: (lesson: IndividualLesson) => lesson.start_time || '-',
    },
    ...(isAdmin
      ? [
          {
            key: 'teacher',
            header: 'المعلم',
            render: (lesson: IndividualLesson) =>
              lesson.teacher?.full_name || '-',
          },
        ]
      : []),
    {
      key: 'student',
      header: 'الطالب',
      render: (lesson: IndividualLesson) =>
        lesson.student?.full_name || '-',
    },
    {
      key: 'education_level',
      header: 'المستوى',
      render: (lesson: IndividualLesson) =>
        lesson.education_level?.name_ar || '-',
    },
    {
      key: 'subject',
      header: 'المادة',
      render: (lesson: IndividualLesson) =>
        lesson.subject?.name_ar || 'عادي',
    },
    { key: 'hours', header: 'الساعات' },
    {
      key: 'approved',
      header: 'الحالة',
      render: (lesson: IndividualLesson) => {
        if (lesson.deleted_at) {
          return (
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
              محذوف
            </span>
          );
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              lesson.approved
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {lesson.approved ? 'معتمد' : 'قيد الانتظار'}
          </span>
        );
      },
    },
    {
      key: 'deletion_note',
      header: 'سبب الحذف',
      render: (lesson: IndividualLesson) =>
        lesson.deleted_at && lesson.deletion_note ? (
          <span className="text-sm text-gray-600" title={lesson.deletion_note}>
            {lesson.deletion_note}
          </span>
        ) : (
          '-'
        ),
    },
    ...((isTeacher || isAdmin)
      ? [
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (lesson: IndividualLesson) => {
              const isDeleted = !!lesson.deleted_at;
              const disableForTeacher = (lesson.approved && !isAdmin) || isDeleted;
              return (
                <div className="flex gap-2 flex-wrap">
                  {isAdmin && !lesson.approved && !isDeleted && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveIndividual(lesson)}
                    >
                      اعتماد
                    </Button>
                  )}
                  {isAdmin && lesson.approved && !isDeleted && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUnapproveIndividual(lesson)}
                    >
                      إلغاء الاعتماد
                    </Button>
                  )}
                  {isTeacher && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenIndividualForm(lesson)}
                        disabled={disableForTeacher}
                      >
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteIndividual(lesson)}
                        disabled={disableForTeacher}
                      >
                        حذف
                      </Button>
                    </>
                  )}
                  {isAdmin && !isDeleted && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteIndividual(lesson)}
                      disabled={lesson.approved}
                    >
                      رفض
                    </Button>
                  )}
                  {isAdmin && isDeleted && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRestoreIndividual(lesson)}
                    >
                      استعادة
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const groupColumns: TableColumn<GroupLesson>[] = [
    {
      key: 'index',
      header: 'الرقم',
      render: (_lesson, index = 0) => groupRowOffset + index + 1,
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (lesson: GroupLesson) => lesson.date,
    },
    {
      key: 'start_time',
      header: 'وقت البدء',
      render: (lesson: GroupLesson) => lesson.start_time || '-',
    },
    ...(isAdmin
      ? [
          {
            key: 'teacher',
            header: 'المعلم',
            render: (lesson: GroupLesson) =>
              lesson.teacher?.full_name || '-',
          },
        ]
      : []),
    {
      key: 'education_level',
      header: 'المستوى',
      render: (lesson: GroupLesson) =>
        lesson.education_level?.name_ar || '-',
    },
    {
      key: 'subject',
      header: 'المادة',
      render: (lesson: GroupLesson) =>
        lesson.subject?.name_ar || 'عادي',
    },
    { key: 'hours', header: 'الساعات' },
    {
      key: 'students',
      header: 'الطلاب المشاركون',
      render: (lesson: GroupLesson) =>
        lesson.students?.map((s) => s.full_name).join(', ') || '-',
    },
    {
      key: 'approved',
      header: 'الحالة',
      render: (lesson: GroupLesson) => {
        if (lesson.deleted_at) {
          return (
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
              محذوف
            </span>
          );
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              lesson.approved
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {lesson.approved ? 'معتمد' : 'قيد الانتظار'}
          </span>
        );
      },
    },
    {
      key: 'deletion_note',
      header: 'سبب الحذف',
      render: (lesson: GroupLesson) =>
        lesson.deleted_at && lesson.deletion_note ? (
          <span className="text-sm text-gray-600" title={lesson.deletion_note}>
            {lesson.deletion_note}
          </span>
        ) : (
          '-'
        ),
    },
    ...((isTeacher || isAdmin)
      ? [
          {
            key: 'actions',
            header: 'الإجراءات',
            render: (lesson: GroupLesson) => {
              const isDeleted = !!lesson.deleted_at;
              const disableForTeacher = (lesson.approved && !isAdmin) || isDeleted;
              return (
                <div className="flex gap-2 flex-wrap">
                  {isAdmin && !lesson.approved && !isDeleted && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveGroup(lesson)}
                    >
                      اعتماد
                    </Button>
                  )}
                  {isAdmin && lesson.approved && !isDeleted && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUnapproveGroup(lesson)}
                    >
                      إلغاء الاعتماد
                    </Button>
                  )}
                  {isTeacher && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenGroupForm(lesson)}
                        disabled={disableForTeacher}
                      >
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteGroup(lesson)}
                        disabled={disableForTeacher}
                      >
                        حذف
                      </Button>
                    </>
                  )}
                  {isAdmin && !isDeleted && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteGroup(lesson)}
                      disabled={lesson.approved}
                    >
                      رفض
                    </Button>
                  )}
                  {isAdmin && isDeleted && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRestoreGroup(lesson)}
                    >
                      استعادة
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const selectedMonthLabel =
    lessonMonths.find((month) => month.value === selectedMonth)?.label || 'الشهر الحالي';
  const totalVisibleLessons =
    filteredIndividualLessons.length + filteredGroupLessons.length;
  const totalPendingLessons =
    pendingIndividualLessons.length + pendingGroupLessons.length;
  const surfaceCardClassName =
    'relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-white/92 shadow-[0_24px_60px_-30px_rgba(11,58,116,0.22)]';
  const filterCardClassName =
    'relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(238,246,252,0.92)_100%)] shadow-[0_22px_50px_-28px_rgba(11,58,116,0.2)]';

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-900" dir="rtl">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,_#eef6fc_0%,_#f8fbff_38%,_#eef5fb_100%)] p-4 sm:p-6"
    >
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
                إدارة الدروس
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                الدروس
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-blue-50/90 sm:text-lg">
                إدارة الدروس الفردية والجماعية ومتابعة حالتها خلال {selectedMonthLabel} {selectedYear}
                بدون التأثير على بيانات النتائج أو محتوى الجداول.
              </p>
            </div>

            {canCreateLessons && (
              <div className="flex flex-wrap gap-3">
                <Button
                  className="!bg-none !bg-white hover:!bg-blue-50 !text-[#0b3a74] !shadow-black/20"
                  onClick={() => handleOpenIndividualForm()}
                >
                  إضافة درس فردي
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => handleOpenGroupForm()}
                >
                  إضافة درس جماعي
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={surfaceCardClassName}>
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#8bc1ff]"></div>
            <div className="p-5">
              <div className="text-sm font-semibold text-[#1b5dab]">إجمالي الدروس الظاهرة</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{totalVisibleLessons}</div>
              <p className="mt-2 text-sm text-slate-600">بحسب التبويب والفلاتر المختارة حالياً.</p>
            </div>
          </div>
          <div className={surfaceCardClassName}>
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#f1d980] via-[#d5b74f] to-[#0b3a74]"></div>
            <div className="p-5">
              <div className="text-sm font-semibold text-[#9b7b10]">الدروس المعلقة</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{totalPendingLessons}</div>
              <p className="mt-2 text-sm text-slate-600">تشمل الفردي والجماعي بانتظار الاعتماد.</p>
            </div>
          </div>
          <div className={surfaceCardClassName}>
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-[#1b5dab] to-[#0b3a74]"></div>
            <div className="p-5">
              <div className="text-sm font-semibold text-indigo-700">الفترة النشطة</div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {selectedMonthLabel}
              </div>
              <p className="mt-2 text-sm text-slate-600">السنة المحددة: {selectedYear}</p>
            </div>
          </div>
        </div>

        {lessonsError && (
          <div className="rounded-[24px] border border-red-200 bg-[linear-gradient(180deg,_#fff5f5_0%,_#fff0f0_100%)] px-5 py-4 text-red-700 shadow-sm">
            {lessonsError}
          </div>
        )}

      {/* Pending Lessons Summary */}
        {(pendingIndividualLessons.length > 0 || pendingGroupLessons.length > 0) && (
          <div className="rounded-[26px] border border-blue-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(221,236,248,0.72)_100%)] p-5 shadow-[0_20px_50px_-30px_rgba(11,58,116,0.22)]">
            <h3 className="mb-2 text-sm font-bold text-[#0b3a74]">الدروس المعلقة (قيد الانتظار)</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              {pendingIndividualLessons.length > 0 && (
                <span className="rounded-full bg-white px-4 py-2 font-medium text-[#1b5dab] shadow-sm">
                  دروس فردية: {pendingIndividualLessons.length}
                </span>
              )}
              {pendingGroupLessons.length > 0 && (
                <span className="rounded-full bg-white px-4 py-2 font-medium text-[#1b5dab] shadow-sm">
                  دروس جماعية: {pendingGroupLessons.length}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-white/85 p-2 shadow-sm">
          {lessonTabs.map((tab) => (
            <button
              key={tab.value}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                activeTab === tab.value
                  ? 'bg-[linear-gradient(135deg,_#0b3a74_0%,_#1b5dab_100%)] text-white shadow-lg shadow-blue-900/20'
                  : 'bg-transparent text-slate-600 hover:bg-blue-50 hover:text-[#0b3a74]'
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

      {activeTab === 'individual' && (
        <>
          <Card title="تصفية الدروس الفردية" className={`${filterCardClassName} mb-6`}>
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Input
                label="بحث"
                placeholder="أدخل اسم الطالب، المعلم، المستوى أو التاريخ"
                value={individualFilters.search}
                onChange={(e) =>
                  setIndividualFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
              <Select
                label="الحالة"
                value={individualFilters.status}
                onChange={(e) =>
                  setIndividualFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                options={statusOptions}
              />
              <Select
                label="السنة"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                options={lessonYears.map((year) => ({
                  value: year,
                  label: `${year}`,
                }))}
              />
              <Select
                label="الشهر"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={lessonMonths}
              />
            </div>
          </Card>

          {isAdmin && filteredPendingIndividualLessons.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3">
              <p className="text-sm text-amber-900">
                يوجد {filteredPendingIndividualLessons.length} درس فردي بانتظار الاعتماد
                {filteredPendingIndividualLessons.length !== pendingIndividualLessons.length &&
                  ` (من أصل ${pendingIndividualLessons.length})`}
              </p>
              <Button
                className="!bg-none !bg-[linear-gradient(135deg,_#0b3a74_0%,_#1b5dab_100%)] !text-white"
                onClick={handleBulkApproveIndividual}
                isLoading={bulkApprovingIndividual}
              >
                اعتماد جميع الدروس الفردية المفلترة
              </Button>
            </div>
          )}

          {individualFormOpen && canCreateLessons && (
            <Card
              title={
                individualEditing ? 'تعديل درس فردي' : 'إضافة درس فردي جديد'
              }
              className={`${surfaceCardClassName} mb-6`}
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
              <form onSubmit={handleIndividualSubmit} className="space-y-4">
                {individualFormError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {individualFormError}
                  </div>
                )}
                {isTeacher && !individualEditing && (
                  <p className="rounded-2xl border border-blue-100 bg-[#eef6fc] p-3 text-sm text-[#0b3a74]">
                    يمكن إضافة الدروس حتى اليوم {lessonSubmissionDeadlineDay ?? LESSON_SUBMISSION_DEADLINE_DAY} من الشهر التالي لشهر الدرس.
                  </p>
                )}

                {!isTeacher && (
                  <Select
                    label="المعلم"
                    value={individualForm.teacher_id}
                    onChange={(e) =>
                      setIndividualForm((prev) => ({
                        ...prev,
                        teacher_id: e.target.value,
                      }))
                    }
                    options={teacherSelectOptions}
                    required
                  />
                )}

                <ComboBox
                  label="الطالب"
                  value={individualForm.student_id}
                  onChange={(value) => {
                    const student = studentsById.get(Number(value));
                    setIndividualForm((prev) => ({
                      ...prev,
                      student_id: value,
                      education_level_id:
                        student?.education_level_id?.toString() ||
                        prev.education_level_id,
                    }));
                  }}
                  options={individualStudentOptions}
                  placeholder="اختر الطالب"
                  required
                />
                {(isAdmin || teachersCanAddStudents) && (
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => setStudentModalOpen(true)}
                      className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-[#1b5dab] transition hover:bg-blue-100"
                    >
                      إضافة طالب جديد
                    </button>
                  </div>
                )}

                <Select
                  label="المستوى التعليمي"
                  value={individualForm.education_level_id}
                  onChange={(e) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      education_level_id: e.target.value,
                      student_id:
                        studentsById.get(Number(prev.student_id))
                          ?.education_level_id?.toString() === e.target.value
                          ? prev.student_id
                          : '',
                      subject_id: prev.lesson_type === 'special' ? prev.subject_id : '',
                    }))
                  }
                  options={[
                    { value: '', label: 'اختر المستوى التعليمي' },
                    ...educationLevels.map((level) => ({
                      value: level.id,
                      label: level.name_ar,
                    })),
                  ]}
                  required
                />

                <div className="space-y-2">
                  <span className="block text-sm font-medium text-gray-900">
                    نوع الدرس
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2">
                      <input
                        type="radio"
                        name="individual_lesson_type"
                        value="regular"
                        checked={individualForm.lesson_type === 'regular'}
                        onChange={() =>
                          setIndividualForm((prev) => ({
                            ...prev,
                            lesson_type: 'regular',
                            subject_id: '',
                          }))
                        }
                      />
                      <span>عادي</span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2">
                      <input
                        type="radio"
                        name="individual_lesson_type"
                        value="special"
                        checked={individualForm.lesson_type === 'special'}
                        onChange={() =>
                          setIndividualForm((prev) => {
                            const remedial = subjects.find((s) => {
                              const levelMatch =
                                !s.education_level_id ||
                                s.education_level_id?.toString() === prev.education_level_id;
                              return levelMatch && isRemedialSubject(s);
                            });
                            return {
                              ...prev,
                              lesson_type: 'special',
                              subject_id: remedial ? remedial.id.toString() : prev.subject_id,
                            };
                          })
                        }
                      />
                      <span>{SPECIAL_LESSON_LABEL}</span>
                    </label>
                  </div>
                </div>
                {individualForm.lesson_type === 'special' && (
                  <Select
                    label="المادة"
                    value={individualForm.subject_id}
                    onChange={(e) =>
                      setIndividualForm((prev) => ({
                        ...prev,
                        subject_id: e.target.value,
                      }))
                    }
                    options={[
                      { value: '', label: 'اختر المادة' },
                      ...subjects
                        .filter((s) => {
                          const levelMatch =
                            !s.education_level_id ||
                            s.education_level_id?.toString() === individualForm.education_level_id;
                          if (!levelMatch) return false;

                          const level = educationLevels.find(
                            (l) => l.id.toString() === individualForm.education_level_id
                          );
                          const levelName = level?.name_ar?.trim() || '';

                          if (isRemedialSubject(s)) {
                            return levelName === 'ابتدائي' || levelName === 'إعدادي';
                          }
                          return true;
                        })
                        .map((s) => ({ value: s.id.toString(), label: s.name_ar })),
                    ]}
                    required
                  />
                )}

                <Input
                  label="تاريخ الدرس"
                  type="date"
                  className="text-right"
                  value={individualForm.date}
                  onChange={(e) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />

                <TimePicker
                  label="وقت بداية الدرس"
                  value={individualForm.start_time}
                  onChange={(value) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      start_time: value,
                    }))
                  }
                  required
                />

                <Select
                  label="عدد الساعات"
                  value={individualForm.hours}
                  onChange={(e) =>
                    setIndividualForm((prev) => ({
                      ...prev,
                      hours: e.target.value,
                    }))
                  }
                  options={[
                    { value: '0.5', label: '30 دقيقة' },
                    { value: '0.75', label: '45 دقيقة' },
                    { value: '1', label: 'ساعة' },
                    { value: '1.25', label: 'ساعة وربع' },
                    { value: '1.5', label: 'ساعة ونصف' },
                    { value: '1.75', label: 'ساعة و45 دقيقة' },
                    { value: '2', label: 'ساعتان' },
                    { value: '2.25', label: 'ساعتان وربع' },
                    { value: '2.5', label: 'ساعتان ونصف' },
                    { value: '2.75', label: 'ساعتان و45 دقيقة' },
                    { value: '3', label: '3 ساعات' },
                  ]}
                  required
                />

                <div className="flex gap-2">
                  <Button type="submit" isLoading={individualSubmitting}>
                    {individualEditing ? 'حفظ التغييرات' : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIndividualFormOpen(false);
                      setIndividualEditing(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card className={`${surfaceCardClassName} p-0`}>
            <div className="border-b border-blue-100 px-6 py-4">
              <div className="text-lg font-black text-[#0b3a74]">قائمة الدروس الفردية</div>
              <p className="mt-1 text-sm text-slate-600">عدد النتائج الحالية: {filteredIndividualLessons.length}</p>
            </div>
            <div className="p-4 pt-0">
              <Table
                columns={individualColumns}
                data={paginatedIndividualLessons}
                emptyMessage="لا توجد دروس فردية"
              />
            </div>
          </Card>

        {filteredIndividualLessons.length > ITEMS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl border border-blue-100 bg-white/80 px-4 py-3">
            <Button
              variant="outline"
              disabled={individualPage === 1}
              onClick={() => setIndividualPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <span className="text-sm font-medium text-slate-600">
              صفحة {individualPage} من{' '}
              {Math.ceil(filteredIndividualLessons.length / ITEMS_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              disabled={
                individualPage ===
                Math.ceil(filteredIndividualLessons.length / ITEMS_PER_PAGE)
              }
              onClick={() =>
                setIndividualPage((p) =>
                  Math.min(
                    Math.ceil(filteredIndividualLessons.length / ITEMS_PER_PAGE),
                    p + 1
                  )
                )
              }
            >
              التالي
            </Button>
          </div>
        )}
        </>
      )}

      {activeTab === 'group' && (
        <>
          <Card title="تصفية الدروس الجماعية" className={`${filterCardClassName} mb-6`}>
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Input
                label="بحث"
                placeholder="أدخل اسم الطالب، المعلم، المستوى أو التاريخ"
                value={groupFilters.search}
                onChange={(e) =>
                  setGroupFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
              <Select
                label="الحالة"
                value={groupFilters.status}
                onChange={(e) =>
                  setGroupFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                options={statusOptions}
              />
              <Select
                label="السنة"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                options={lessonYears.map((year) => ({
                  value: year,
                  label: `${year}`,
                }))}
              />
              <Select
                label="الشهر"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={lessonMonths}
              />
            </div>
          </Card>

          {isAdmin && filteredPendingGroupLessons.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3">
              <p className="text-sm text-amber-900">
                يوجد {filteredPendingGroupLessons.length} درس جماعي بانتظار الاعتماد
                {filteredPendingGroupLessons.length !== pendingGroupLessons.length &&
                  ` (من أصل ${pendingGroupLessons.length})`}
              </p>
              <Button
                className="!bg-none !bg-[linear-gradient(135deg,_#0b3a74_0%,_#1b5dab_100%)] !text-white"
                onClick={handleBulkApproveGroup}
                isLoading={bulkApprovingGroup}
              >
                اعتماد جميع الدروس الجماعية المفلترة
              </Button>
            </div>
          )}

          {groupFormOpen && canCreateLessons && (
            <Card
              title={
                groupEditing ? 'تعديل درس جماعي' : 'إضافة درس جماعي جديد'
              }
              className={`${surfaceCardClassName} mb-6`}
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
              <form onSubmit={handleGroupSubmit} className="space-y-4">
                {groupFormError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {groupFormError}
                  </div>
                )}
                {isTeacher && !groupEditing && (
                  <p className="rounded-2xl border border-blue-100 bg-[#eef6fc] p-3 text-sm text-[#0b3a74]">
                    يمكن إضافة الدروس حتى اليوم {lessonSubmissionDeadlineDay ?? LESSON_SUBMISSION_DEADLINE_DAY} من الشهر التالي لشهر الدرس.
                  </p>
                )}

                {!isTeacher && (
                  <Select
                    label="المعلم"
                    value={groupForm.teacher_id}
                    onChange={(e) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        teacher_id: e.target.value,
                      }))
                    }
                    options={teacherSelectOptions}
                    required
                  />
                )}

                <Select
                  label="المستوى التعليمي"
                  value={groupForm.education_level_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGroupForm((prev) => ({
                      ...prev,
                      education_level_id: value,
                      subject_id: prev.lesson_type === 'special' ? prev.subject_id : '',
                      studentIds: value
                        ? prev.studentIds.filter((id) => {
                            const student = studentsById.get(id);
                            return (
                              student?.education_level_id?.toString() === value
                            );
                          })
                        : prev.studentIds,
                      search: prev.search,
                    }));
                  }}
                  options={[
                    { value: '', label: 'اختر المستوى التعليمي' },
                    ...educationLevels
                      .filter((level) => level.name_ar !== 'جامعي')
                      .map((level) => ({
                        value: level.id,
                        label: level.name_ar,
                      })),
                  ]}
                  required
                />

                <div className="space-y-2">
                  <span className="block text-sm font-medium text-gray-900">
                    نوع الدرس
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2">
                      <input
                        type="radio"
                        name="group_lesson_type"
                        value="regular"
                        checked={groupForm.lesson_type === 'regular'}
                        onChange={() =>
                          setGroupForm((prev) => ({
                            ...prev,
                            lesson_type: 'regular',
                            subject_id: '',
                          }))
                        }
                      />
                      <span>عادي</span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2">
                      <input
                        type="radio"
                        name="group_lesson_type"
                        value="special"
                        checked={groupForm.lesson_type === 'special'}
                      onChange={() =>
                        setGroupForm((prev) => {
                          const remedial = subjects.find((s) => {
                            const levelMatch =
                              !s.education_level_id ||
                              s.education_level_id?.toString() === prev.education_level_id;
                            return levelMatch && isRemedialSubject(s);
                          });
                          return {
                            ...prev,
                            lesson_type: 'special',
                            subject_id: remedial ? remedial.id.toString() : prev.subject_id,
                          };
                        })
                      }
                      />
                      <span>{SPECIAL_LESSON_LABEL}</span>
                    </label>
                  </div>
                </div>
                {groupForm.lesson_type === 'special' && (
                  <Select
                    label="المادة"
                    value={groupForm.subject_id}
                    onChange={(e) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        subject_id: e.target.value,
                      }))
                    }
                    options={[
                      { value: '', label: 'اختر المادة' },
                      ...subjects
                        .filter((s) => {
                          const levelMatch =
                            !s.education_level_id ||
                            s.education_level_id?.toString() === groupForm.education_level_id;
                          if (!levelMatch) return false;

                          const level = educationLevels.find(
                            (l) => l.id.toString() === groupForm.education_level_id
                          );
                          const levelName = level?.name_ar?.trim() || '';

                          if (isRemedialSubject(s)) {
                            return levelName === 'ابتدائي' || levelName === 'إعدادي';
                          }
                          return true;
                        })
                        .map((s) => ({ value: s.id.toString(), label: s.name_ar })),
                    ]}
                    required
                  />
                )}

                <Input
                  label="تاريخ الدرس"
                  type="date"
                  className="text-right"
                  value={groupForm.date}
                  onChange={(e) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />

                <TimePicker
                  label="وقت بداية الدرس"
                  value={groupForm.start_time}
                  onChange={(value) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      start_time: value,
                    }))
                  }
                  required
                />

                <Select
                  label="عدد الساعات"
                  value={groupForm.hours}
                  onChange={(e) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      hours: e.target.value,
                    }))
                  }
                  options={[
                    { value: '0.5', label: '30 دقيقة' },
                    { value: '0.75', label: '45 دقيقة' },
                    { value: '1', label: 'ساعة' },
                    { value: '1.25', label: 'ساعة وربع' },
                    { value: '1.5', label: 'ساعة ونصف' },
                    { value: '1.75', label: 'ساعة و45 دقيقة' },
                    { value: '2', label: 'ساعتان' },
                    { value: '2.25', label: 'ساعتان وربع' },
                    { value: '2.5', label: 'ساعتان ونصف' },
                    { value: '2.75', label: 'ساعتان و45 دقيقة' },
                    { value: '3', label: '3 ساعات' },
                  ]}
                  required
                />

                <Card title="إضافة الطلاب إلى الدرس" className="border border-blue-100 bg-[#f8fbff] shadow-none">
                  <div className="space-y-4">
                    <Card className="border border-blue-100/80 bg-white shadow-sm">
                      <p className="mb-3 text-sm font-medium text-[#0b3a74]">
                        لإضافة طالب موجود: اكتب اسمه في الحقل أدناه ثم اختره من القائمة.
                      </p>
                      <div className="space-y-3">
                        <ComboBox
                          label="اختر طالباً من القائمة (ابحث بالاسم)"
                          value=""
                          onChange={(value) => {
                            const selectedId = Number(value);
                            if (!selectedId) return;
                            const selectedStudent = studentsById.get(selectedId);
                            setGroupForm((prev) => ({
                              ...prev,
                              studentIds: [...prev.studentIds, selectedId],
                              education_level_id:
                                prev.education_level_id ||
                                selectedStudent?.education_level_id?.toString() ||
                                '',
                            }));
                          }}
                          options={availableGroupStudentOptions}
                          placeholder="اكتب اسم الطالب ثم اختره من القائمة لإضافته"
                          disabled={availableGroupStudentOptions.length === 0}
                        />
                        {(isAdmin || teachersCanAddStudents) && (
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <span>الطالب غير مسجّل في النظام؟</span>
                            <Button
                              type="button"
                              onClick={() => setStudentModalOpen(true)}
                              variant="secondary"
                              size="sm"
                              className="shrink-0"
                            >
                              إضافة طالب جديد
                            </Button>
                          </p>
                        )}
                      </div>
                      {availableGroupStudentOptions.length === 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                          لا يوجد طلاب مطابقون للبحث الحالي أو تم اختيارهم بالفعل.
                        </p>
                      )}
                    </Card>

                    <div className="flex flex-wrap gap-2">
                      {selectedGroupStudents.map((student) => (
                        <span
                          key={student.id}
                          className="flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm font-medium text-[#0b3a74]"
                        >
                          {student.full_name}
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() =>
                              setGroupForm((prev) => ({
                                ...prev,
                                studentIds: prev.studentIds.filter(
                                  (id) => id !== student.id
                                ),
                              }))
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {selectedGroupStudents.length === 0 && (
                        <p className="text-sm text-gray-600">
                          يجب اختيار طالبين على الأقل
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="flex gap-2">
                  <Button type="submit" isLoading={groupSubmitting}>
                    {groupEditing ? 'حفظ التغييرات' : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setGroupFormOpen(false);
                      setGroupEditing(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
        </Card>
      )}

          <Card className={`${surfaceCardClassName} p-0`}>
            <div className="border-b border-blue-100 px-6 py-4">
              <div className="text-lg font-black text-[#0b3a74]">قائمة الدروس الجماعية</div>
              <p className="mt-1 text-sm text-slate-600">عدد النتائج الحالية: {filteredGroupLessons.length}</p>
            </div>
            <div className="p-4 pt-0">
              <Table
                columns={groupColumns}
                data={paginatedGroupLessons}
                emptyMessage="لا توجد دروس جماعية"
              />
            </div>
          </Card>

        {filteredGroupLessons.length > ITEMS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl border border-blue-100 bg-white/80 px-4 py-3">
            <Button
              variant="outline"
              disabled={groupPage === 1}
              onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <span className="text-sm font-medium text-slate-600">
              صفحة {groupPage} من{' '}
              {Math.ceil(filteredGroupLessons.length / ITEMS_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              disabled={
                groupPage ===
                Math.ceil(filteredGroupLessons.length / ITEMS_PER_PAGE)
              }
              onClick={() =>
                setGroupPage((p) =>
                  Math.min(
                    Math.ceil(filteredGroupLessons.length / ITEMS_PER_PAGE),
                    p + 1
                  )
                )
              }
            >
              التالي
            </Button>
          </div>
        )}
        </>
      )}
      </div>

      {/* Student Modal */}
      <Modal
        open={studentModalOpen}
        onClose={() => {
          setStudentModalOpen(false);
          resetStudentForm();
        }}
      >
        <Card title="إضافة طالب جديد">
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            {studentFormError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {studentFormError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="الاسم الأول"
                  type="text"
                  value={studentFormData.first_name}
                  onChange={(e) => {
                    setStudentFormData({ ...studentFormData, first_name: e.target.value });
                    setStudentFieldErrors((prev) => ({ ...prev, first_name: undefined }));
                  }}
                  required
                />
                {studentFieldErrors.first_name && (
                  <p className="text-sm text-red-600">{studentFieldErrors.first_name}</p>
                )}
              </div>
              <div>
                <Input
                  label="اسم العائلة"
                  type="text"
                  value={studentFormData.last_name}
                  onChange={(e) => {
                    setStudentFormData({ ...studentFormData, last_name: e.target.value });
                    setStudentFieldErrors((prev) => ({ ...prev, last_name: undefined }));
                  }}
                  required
                />
                {studentFieldErrors.last_name && (
                  <p className="text-sm text-red-600">{studentFieldErrors.last_name}</p>
                )}
              </div>
            </div>

            <Select
              label="المستوى التعليمي"
              value={studentFormData.education_level_id}
              onChange={(e) => {
                setStudentFormData({ ...studentFormData, education_level_id: e.target.value });
                setStudentFieldErrors((prev) => ({ ...prev, education_level_id: undefined }));
              }}
              options={[
                { value: '', label: 'اختر المستوى التعليمي' },
                ...educationLevels.map((level) => ({
                  value: level.id.toString(),
                  label: level.name_ar || level.name_en || `Level ${level.id}`,
                })),
              ]}
              required
            />
            {studentFieldErrors.education_level_id && (
              <p className="text-sm text-red-600">{studentFieldErrors.education_level_id}</p>
            )}

            <Select
              label="الصف"
              value={studentFormData.class}
              onChange={(e) => {
                setStudentFormData({ ...studentFormData, class: e.target.value });
                setStudentFieldErrors((prev) => ({ ...prev, class: undefined }));
              }}
              options={[
                { value: '', label: 'اختر الصف' },
                ...getStudentClassOptionsForLevel(studentFormData.education_level_id || '').map((c) => ({
                  value: c,
                  label: c,
                })),
              ]}
              required
            />
            {studentFieldErrors.class && (
              <p className="text-sm text-red-600">{studentFieldErrors.class}</p>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                isLoading={studentSubmitting}
                disabled={educationLevels.length === 0}
              >
                إضافة
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setStudentModalOpen(false);
                  resetStudentForm();
                }}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLessonToDelete(null);
          setDeletionNote('');
        }}
        ariaLabel="تأكيد الحذف"
      >
        <Card title="تأكيد الحذف">
          <div className="space-y-4">
            <p className="text-gray-700">
              هل أنت متأكد من حذف هذا الدرس؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب الحذف (اختياري)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={deletionNote}
                  onChange={(e) => setDeletionNote(e.target.value)}
                  placeholder="اكتب سبب الحذف هنا..."
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setLessonToDelete(null);
                  setDeletionNote('');
                }}
                disabled={deleting}
              >
                إلغاء
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={deleting}
              >
                حذف
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
}


