'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div
        className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#ddecf8_0%,_#ffffff_38%,_#eef6fc_100%)] py-16"
        dir="rtl"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-[-5rem] h-80 w-80 rounded-full bg-[#1b5dab]/14 blur-3xl"></div>
          <div className="absolute bottom-[-7rem] left-[-2rem] h-96 w-96 rounded-full bg-[#f1d980]/20 blur-3xl"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage:
              'repeating-linear-gradient(168deg, transparent 0 26px, rgba(27,93,171,0.12) 26px 28px)',
            transform: 'scale(1.15)',
            transformOrigin: 'top right',
          }}></div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-[36px] border border-white/70 bg-white/55 p-3 shadow-[0_30px_90px_-40px_rgba(11,58,116,0.35)] backdrop-blur-xl">
            <div className="grid overflow-hidden rounded-[30px] border border-blue-100/80 bg-white shadow-[0_24px_60px_-30px_rgba(11,58,116,0.25)] lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative overflow-hidden bg-[linear-gradient(180deg,_#0b3a74_0%,_#0a3569_100%)] px-8 py-12 text-white sm:px-10 lg:px-12">
                <div className="absolute inset-0 opacity-15" style={{
                  backgroundImage:
                    'repeating-linear-gradient(168deg, transparent 0 26px, rgba(147,197,253,0.22) 26px 28px)',
                  transform: 'scale(1.2)',
                  transformOrigin: 'top right',
                }}></div>
                <div className="absolute -top-10 left-10 h-40 w-40 rounded-full bg-[#8bc1ff]/12 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 h-36 w-36 rounded-tl-full bg-[#f1d980]/18 blur-2xl"></div>
                <div className="absolute inset-x-0 bottom-0 h-3 bg-[#f1d980]"></div>

                <div className="relative z-10">
                  <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-blue-50/90 shadow-sm backdrop-blur-md">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f1d980]"></span>
                    لوحة التحكم الإدارية
                  </div>

                  <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
                    لوحة التحكم
                    <span className="block text-[#8bc1ff]">الإدارية</span>
                  </h1>

                  <div className="mb-5 flex">
                    <span className="h-1.5 w-24 rounded-full bg-gradient-to-r from-white/80 via-[#f1d980] to-white/80"></span>
                  </div>

                  <p className="max-w-md text-lg leading-8 text-blue-50/90">
                    أدخل بيانات الدخول للوصول إلى نظام إدارة المعهد ومتابعة الطلاب، الدروس،
                    والمدفوعات. هذا النظام مخصص لموظفي المعهد فقط ويعرض لكل مستخدم الأدوات
                    المرتبطة بصلاحيته داخل النظام.
                  </p>

                  <div className="mt-10 space-y-4">
                    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                      <div className="mb-1 text-sm font-semibold text-[#f1d980]">واجهة منظمة</div>
                      <p className="text-sm leading-7 text-blue-50/85">
                        وصول سريع للأقسام الأساسية مع تصميم مريح وواضح أثناء العمل اليومي.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                      <div className="mb-1 text-sm font-semibold text-[#f1d980]">دخول آمن</div>
                      <p className="text-sm leading-7 text-blue-50/85">
                        صلاحيات مخصصة للإدارة والمعلمين مع تجربة استخدام متناسقة داخل النظام.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(238,246,252,0.95)_100%)] px-8 py-10 sm:px-10 lg:px-12">
                <div className="absolute top-0 left-0 h-24 w-24 rounded-br-[32px] bg-[#ddecf8]"></div>
                <div className="relative z-10">
                  <div className="mb-8">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ddecf8] px-4 py-1.5 text-xs font-bold text-[#0b3a74]">
                      <span className="h-2 w-2 rounded-full bg-[#1b5dab]"></span>
                      معهد المرام
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0b3a74]">
                      أدخل بيانات الدخول
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      يرجى إدخال اسم المستخدم وكلمة المرور للمتابعة.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                      label="اسم المستخدم"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                      className="border-blue-100 bg-white focus:border-[#1b5dab] focus:ring-[#1b5dab]"
                    />

                    <Input
                      label="كلمة المرور"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-blue-100 bg-white focus:border-[#1b5dab] focus:ring-[#1b5dab]"
                    />

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      isLoading={isLoading}
                      disabled={!username || !password}
                      className="w-full !border-0 !bg-[linear-gradient(135deg,_#c9a227_0%,_#d4af37_50%,_#b8860b_100%)] !text-white !shadow-[0_20px_40px_-20px_rgba(184,134,11,0.5)] hover:!bg-[linear-gradient(135deg,_#b8860b_0%,_#c9a227_50%,_#9a7b0a_100%)] hover:!shadow-[0_24px_45px_-18px_rgba(184,134,11,0.55)] focus:!ring-[#b8860b] active:!bg-[linear-gradient(135deg,_#9a7b0a_0%,_#b8860b_50%,_#7a6010_100%)] disabled:!opacity-70 disabled:hover:!bg-[linear-gradient(135deg,_#c9a227_0%,_#d4af37_50%,_#b8860b_100%)] disabled:hover:!scale-100"
                    >
                      تسجيل الدخول
                    </Button>
                  </form>

                  <div className="mt-6 rounded-2xl border border-blue-100 bg-white/90 px-4 py-4 shadow-sm">
                    <div className="mb-1 text-sm font-bold text-[#0b3a74]">ملاحظة</div>
                    <p className="text-sm leading-7 text-slate-600">
                      في حال واجهت مشكلة في تسجيل الدخول، تواصل مع مدير النظام لإعادة ضبط الحساب.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
