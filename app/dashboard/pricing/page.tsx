'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { config } from '@/lib/config';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pricing, EducationLevel, Subject, SubjectGroupPricingTier } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    education_level_id: '',
    lesson_type: '',
    price_per_hour: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectFormData, setSubjectFormData] = useState({
    name_ar: '',
    name_en: '',
    education_level_id: '',
    price_per_hour: '',
  });
  const [subjectError, setSubjectError] = useState('');
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);

  const [subjectGroupTiers, setSubjectGroupTiers] = useState<SubjectGroupPricingTier[]>([]);
  const [showSubjectTierForm, setShowSubjectTierForm] = useState(false);
  const [editingSubjectTier, setEditingSubjectTier] = useState<SubjectGroupPricingTier | null>(null);
  const [subjectTierFormData, setSubjectTierFormData] = useState({
    subject_id: '',
    student_count: '',
    total_price: '',
    price_per_student: '',
  });
  const [subjectTierError, setSubjectTierError] = useState('');
  const [subjectTierSubmitting, setSubjectTierSubmitting] = useState(false);

  const { isAdmin } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pricingRes, levelsRes, subjectsRes, tiersRes] = await Promise.all([
        api.getPricing(),
        api.getEducationLevels(),
        api.getSubjects(),
        api.getSubjectGroupTiers(),
      ]);

      if (pricingRes.success && pricingRes.data) {
        setPricing(pricingRes.data as Pricing[]);
      }
      if (levelsRes.success && levelsRes.data) {
        setEducationLevels(levelsRes.data as EducationLevel[]);
      }
      if (subjectsRes.success && subjectsRes.data) {
        setSubjects(subjectsRes.data as Subject[]);
      }
      if (tiersRes.success && tiersRes.data) {
        setSubjectGroupTiers((tiersRes.data as SubjectGroupPricingTier[]) || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const submitData = {
        education_level_id: parseInt(formData.education_level_id),
        lesson_type: formData.lesson_type,
        price_per_hour: parseFloat(formData.price_per_hour),
      };

      const response = await api.savePricing(submitData);
      if (response.success) {
        await loadData();
        resetForm();
      } else {
        setError(response.error || 'فشل حفظ التسعير');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      education_level_id: '',
      lesson_type: '',
      price_per_hour: '',
    });
    setShowForm(false);
    setError('');
  };

  const resetSubjectForm = () => {
    setSubjectFormData({
      name_ar: '',
      name_en: '',
      education_level_id: '',
      price_per_hour: '',
    });
    setEditingSubjectId(null);
    setShowSubjectForm(false);
    setSubjectError('');
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError('');
    setSubjectSubmitting(true);
    try {
      const price = parseFloat(subjectFormData.price_per_hour);
      if (Number.isNaN(price) || price < 0) {
        setSubjectError('السعر غير صالح');
        setSubjectSubmitting(false);
        return;
      }
      if (editingSubjectId) {
        const res = await api.updateSubject(editingSubjectId, {
          name_ar: subjectFormData.name_ar.trim(),
          name_en: subjectFormData.name_en.trim() || null,
          education_level_id: subjectFormData.education_level_id ? parseInt(subjectFormData.education_level_id, 10) : null,
          price_per_hour: price,
        });
        if (res.success) {
          await loadData();
          resetSubjectForm();
        } else {
          setSubjectError(res.error || 'فشل تحديث المادة');
        }
      } else {
        const res = await api.createSubject({
          name_ar: subjectFormData.name_ar.trim(),
          name_en: subjectFormData.name_en.trim() || null,
          education_level_id: subjectFormData.education_level_id ? parseInt(subjectFormData.education_level_id, 10) : null,
          price_per_hour: price,
        });
        if (res.success) {
          await loadData();
          resetSubjectForm();
        } else {
          setSubjectError(res.error || 'فشل إضافة المادة');
        }
      }
    } catch (err: any) {
      setSubjectError(err.message || 'حدث خطأ');
    } finally {
      setSubjectSubmitting(false);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setSubjectFormData({
      name_ar: subject.name_ar,
      name_en: subject.name_en || '',
      education_level_id: subject.education_level_id?.toString() ?? '',
      price_per_hour: subject.price_per_hour.toString(),
    });
    setShowSubjectForm(true);
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!window.confirm(`حذف المادة «${subject.name_ar}»؟ الدروس المرتبطة ستبقى لكن بدون مادة خاصة.`)) return;
    const res = await api.deleteSubject(subject.id);
    if (res.success) await loadData();
    else setSubjectError(res.error || 'فشل الحذف');
  };

  const resetSubjectTierForm = () => {
    setSubjectTierFormData({
      subject_id: '',
      student_count: '',
      total_price: '',
      price_per_student: '',
    });
    setEditingSubjectTier(null);
    setShowSubjectTierForm(false);
    setSubjectTierError('');
  };

  const handleSubjectTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectTierError('');
    setSubjectTierSubmitting(true);
    try {
      const res = await api.saveSubjectGroupTier({
        ...(editingSubjectTier?.id && { id: editingSubjectTier.id }),
        subject_id: parseInt(subjectTierFormData.subject_id, 10),
        student_count: parseInt(subjectTierFormData.student_count, 10),
        total_price: parseFloat(subjectTierFormData.total_price),
        price_per_student:
          subjectTierFormData.price_per_student !== ''
            ? parseFloat(subjectTierFormData.price_per_student)
            : null,
      });
      if (res.success) {
        await loadData();
        resetSubjectTierForm();
      } else {
        setSubjectTierError(res.error || 'فشل الحفظ');
      }
    } catch (err: any) {
      setSubjectTierError(err.message || 'حدث خطأ');
    } finally {
      setSubjectTierSubmitting(false);
    }
  };

  const handleEditSubjectTier = (tier: SubjectGroupPricingTier) => {
    setEditingSubjectTier(tier);
    setSubjectTierFormData({
      subject_id: String(tier.subject_id),
      student_count: String(tier.student_count),
      total_price: String(tier.total_price),
      price_per_student: tier.price_per_student != null ? String(tier.price_per_student) : '',
    });
    setShowSubjectTierForm(true);
  };

  const handleDeleteSubjectTier = async (tier: SubjectGroupPricingTier) => {
    const subName = (tier as any).subject?.name_ar || `#${tier.subject_id}`;
    if (!window.confirm(`حذف شريحة «${subName}» — ${tier.student_count} طلاب؟`)) return;
    const res = await api.deleteSubjectGroupTier(tier.id);
    if (res.success) await loadData();
    else setSubjectTierError(res.error || 'فشل الحذف');
  };

  const columns = [
    {
      key: 'education_level',
      header: 'المستوى التعليمي',
      render: (item: any) => item.education_level?.name_ar || '-',
    },
    {
      key: 'lesson_type',
      header: 'نوع الدرس',
      render: (item: Pricing) => (item.lesson_type === 'individual' ? 'فردي' : 'جماعي'),
    },
    {
      key: 'price_per_hour',
      header: 'السعر لكل ساعة (₪)',
      render: (item: Pricing) => item.price_per_hour.toFixed(2),
    },
  ];

  if (loading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">التسعير</h1>
        <div className="flex items-center gap-2">
          {config.app.groupPricingMode === 'tiers' && (
            <Link href="/dashboard/pricing/tiers">
              <Button variant="secondary">شرائح التسعير الجماعي</Button>
            </Link>
          )}
          {!showForm && isAdmin && (
            <Button onClick={() => setShowForm(true)}>إضافة/تحديث سعر</Button>
          )}
        </div>
      </div>

      {showForm && isAdmin && (
        <Card title="إضافة/تحديث السعر" className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Select
              label="المستوى التعليمي"
              value={formData.education_level_id}
              onChange={(e) =>
                setFormData({ ...formData, education_level_id: e.target.value })
              }
              options={[
                { value: '', label: 'اختر المستوى التعليمي' },
                ...educationLevels.map((level) => ({
                  value: level.id.toString(),
                  label: level.name_ar,
                })),
              ]}
              required
            />
            <Select
              label="نوع الدرس"
              value={formData.lesson_type}
              onChange={(e) =>
                setFormData({ ...formData, lesson_type: e.target.value })
              }
              options={
                config.app.groupPricingMode === 'tiers'
                  ? [
                      { value: '', label: 'اختر نوع الدرس' },
                      { value: 'individual', label: 'فردي' },
                    ]
                  : [
                      { value: '', label: 'اختر نوع الدرس' },
                      { value: 'individual', label: 'فردي' },
                      { value: 'group', label: 'جماعي' },
                    ]
              }
              required
            />
            {config.app.groupPricingMode === 'tiers' && (
              <p className="text-sm text-gray-600">
                ملاحظة: في وضع الشرائح، يتم إدارة الأسعار الجماعية من صفحة شرائح التسعير الجماعي فقط.
              </p>
            )}
            <Input
              label="السعر لكل ساعة (₪)"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_per_hour}
              onChange={(e) =>
                setFormData({ ...formData, price_per_hour: e.target.value })
              }
              required
            />

            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                حفظ
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Table
          columns={columns}
          data={
            config.app.groupPricingMode === 'tiers'
              ? pricing.filter((p) => p.lesson_type === 'individual')
              : pricing
          }
          emptyMessage="لا يوجد أسعار محددة"
        />
      </Card>

      {/* Special lessons (دروس خاصة) */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">دروس خاصة (مواد ذات سعر خاص)</h2>
        {showSubjectForm && isAdmin && (
          <Card title={editingSubjectId ? 'تعديل المادة' : 'إضافة مادة خاصة'} className="mb-6">
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              {subjectError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {subjectError}
                </div>
              )}
              <Input
                label="الاسم بالعربية"
                value={subjectFormData.name_ar}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, name_ar: e.target.value })}
                required
              />
              <Input
                label="الاسم بالإنجليزية (اختياري)"
                value={subjectFormData.name_en}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, name_en: e.target.value })}
              />
              <Select
                label="المستوى التعليمي (اختياري - فارغ = لجميع المستويات)"
                value={subjectFormData.education_level_id}
                onChange={(e) =>
                  setSubjectFormData({ ...subjectFormData, education_level_id: e.target.value })
                }
                options={[
                  { value: '', label: 'جميع المستويات' },
                  ...educationLevels.map((l) => ({ value: l.id.toString(), label: l.name_ar })),
                ]}
              />
              <Input
                label="السعر لكل ساعة (₪)"
                type="number"
                step="0.01"
                min="0"
                value={subjectFormData.price_per_hour}
                onChange={(e) =>
                  setSubjectFormData({ ...subjectFormData, price_per_hour: e.target.value })
                }
                required
              />
              <div className="flex gap-2">
                <Button type="submit" isLoading={subjectSubmitting}>
                  {editingSubjectId ? 'تحديث' : 'إضافة'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetSubjectForm}>
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        )}
        {!showSubjectForm && isAdmin && (
          <div className="mb-4">
            <Button onClick={() => setShowSubjectForm(true)}>إضافة مادة خاصة</Button>
          </div>
        )}
        <Card>
          <Table
            columns={[
              {
                key: 'name_ar',
                header: 'الاسم (عربي)',
                render: (item: Subject) => item.name_ar,
              },
              {
                key: 'name_en',
                header: 'الاسم (إنجليزي)',
                render: (item: Subject) => item.name_en || '-',
              },
              {
                key: 'education_level',
                header: 'المستوى',
                render: (item: Subject) =>
                  item.education_level?.name_ar ?? 'جميع المستويات',
              },
              {
                key: 'price_per_hour',
                header: 'السعر/ساعة (₪)',
                render: (item: Subject) => item.price_per_hour.toFixed(2),
              },
              ...(isAdmin
                ? [
                    {
                      key: 'actions',
                      header: 'إجراءات',
                      render: (item: Subject) => (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditSubject(item)}
                          >
                            تعديل
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteSubject(item)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            حذف
                          </Button>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            data={subjects}
            emptyMessage="لا توجد مواد خاصة. أضف مواد (رياضيات، فيزياء، إلخ) مع سعر لكل ساعة."
          />
        </Card>

        {/* Subject group pricing tiers: for group lessons with a special subject, price by student count (2=X, 3=Y, ...). Remedial can be left without tiers. */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">شرائح التسعير الجماعي للمواد الخاصة</h3>
          <p className="text-sm text-gray-600 mb-4">
            للدروس الجماعية مع مادة خاصة: حدد سعراً حسب عدد الطلاب (مثلاً 2 طلاب = X، 3 = Y). إن لم تُضف شريحة لمادة معينة، يُستخدم سعر المادة/الساعة العادي.
          </p>
          {showSubjectTierForm && isAdmin && (
            <Card title={editingSubjectTier ? 'تعديل الشريحة' : 'إضافة / تحديث شريحة'} className="mb-6">
              <form onSubmit={handleSubjectTierSubmit} className="space-y-4">
                {subjectTierError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {subjectTierError}
                  </div>
                )}
                <Select
                  label="المادة"
                  value={subjectTierFormData.subject_id}
                  onChange={(e) =>
                    setSubjectTierFormData({ ...subjectTierFormData, subject_id: e.target.value })
                  }
                  options={[
                    { value: '', label: 'اختر المادة' },
                    ...subjects.map((s) => ({ value: String(s.id), label: s.name_ar })),
                  ]}
                  required
                />
                <Select
                  label="عدد الطلاب"
                  value={subjectTierFormData.student_count}
                  onChange={(e) =>
                    setSubjectTierFormData({ ...subjectTierFormData, student_count: e.target.value })
                  }
                  options={[
                    { value: '', label: 'اختر العدد' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                    { value: '5', label: '5' },
                  ]}
                  required
                />
                <Input
                  label="السعر الإجمالي / ساعة (ر.س)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={subjectTierFormData.total_price}
                  onChange={(e) =>
                    setSubjectTierFormData({ ...subjectTierFormData, total_price: e.target.value })
                  }
                  required
                />
                <Input
                  label="السعر لكل طالب (اختياري)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={subjectTierFormData.price_per_student}
                  onChange={(e) =>
                    setSubjectTierFormData({ ...subjectTierFormData, price_per_student: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <Button type="submit" isLoading={subjectTierSubmitting}>
                    {editingSubjectTier ? 'تحديث' : 'إضافة'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetSubjectTierForm}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </Card>
          )}
          {!showSubjectTierForm && isAdmin && (
            <div className="mb-4">
              <Button onClick={() => setShowSubjectTierForm(true)}>إضافة / تحديث شريحة</Button>
            </div>
          )}
          <Card>
            <Table
              columns={[
                {
                  key: 'subject',
                  header: 'المادة',
                  render: (row: SubjectGroupPricingTier) =>
                    (row as any).subject?.name_ar ?? `#${row.subject_id}`,
                },
                { key: 'student_count', header: 'عدد الطلاب', render: (row: SubjectGroupPricingTier) => String(row.student_count) },
                {
                  key: 'total_price',
                  header: 'السعر الإجمالي/ساعة (ر.س)',
                  render: (row: SubjectGroupPricingTier) => Number(row.total_price).toFixed(2),
                },
                {
                  key: 'price_per_student',
                  header: 'لكل طالب (ر.س)',
                  render: (row: SubjectGroupPricingTier) =>
                    row.price_per_student != null ? Number(row.price_per_student).toFixed(2) : '—',
                },
                ...(isAdmin
                  ? [
                      {
                        key: 'actions',
                        header: 'الإجراءات',
                        render: (row: SubjectGroupPricingTier) => (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditSubjectTier(row)}
                            >
                              تعديل
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteSubjectTier(row)}
                            >
                              حذف
                            </Button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
              data={subjectGroupTiers}
              emptyMessage="لا توجد شرائح. أضف شرائح للمواد الخاصة (مثلاً رياضيات: 2 طلاب = 140، 3 = 210)."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
