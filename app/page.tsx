'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { RulesSection } from '@/components/sections/RulesSection';
import { 
  TeacherIcon, 
  StudentIcon, 
  LessonIcon, 
  PaymentIcon, 
  StatsIcon, 
  SecurityIcon 
} from '@/components/icons/FeatureIcons';

function SectionHeading({
  eyebrow,
  title,
  description,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  inverted?: boolean;
}) {
  const eyebrowClasses = inverted
    ? 'border-white/15 bg-white/10 text-blue-50/90'
    : 'border-blue-100 bg-white/80 text-[#0b3a74]';
  const titleClasses = inverted ? 'text-white' : 'text-slate-900';
  const descriptionClasses = inverted ? 'text-blue-50/85' : 'text-slate-600';
  const lineClasses = inverted
    ? 'from-white/80 via-[#f1d980] to-white/80'
    : 'from-[#0b3a74] via-[#1b5dab] to-[#f1d980]';

  return (
    <div className="text-center mb-16">
      <div className={`mb-4 inline-flex items-center gap-3 rounded-full border px-5 py-2 text-sm font-semibold shadow-sm ${eyebrowClasses}`}>
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1b5dab]"></span>
        {eyebrow}
      </div>
      <h2 className={`text-5xl md:text-6xl font-black mb-4 tracking-tight ${titleClasses}`}>
        {title}
      </h2>
      <div className="mb-5 flex justify-center">
        <span className={`h-1.5 w-24 rounded-full bg-gradient-to-r ${lineClasses}`}></span>
      </div>
      <p className={`text-xl max-w-2xl mx-auto leading-relaxed ${descriptionClasses}`}>
        {description}
      </p>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-white">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-[#1877f2] rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-6 text-gray-700 font-semibold text-lg animate-pulse">جاري التحميل...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const features = [
    {
      Icon: TeacherIcon,
      title: 'إدارة المعلمين',
      description: 'إدارة المعلمين، متابعة جداولهم ومراقبة الأداء',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-white',
      delay: '0ms',
    },
    {
      Icon: StudentIcon,
      title: 'إدارة الطلاب',
      description: 'متابعة الطلاب وتقدمهم والحضور',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-white',
      delay: '100ms',
    },
    {
      Icon: LessonIcon,
      title: 'تخطيط الدروس',
      description: 'تنظيم الدروس الفردية والجماعية بكفاءة',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-white',
      delay: '200ms',
    },
    {
      Icon: PaymentIcon,
      title: 'تتبع المدفوعات',
      description: 'مراقبة المدفوعات وإدارة السجلات المالية',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-white',
      delay: '300ms',
    },
    {
      Icon: StatsIcon,
      title: 'الإحصائيات والتقارير',
      description: 'إنشاء تقارير شاملة وتحليلات مفصلة',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-white',
      delay: '400ms',
    },
    {
      Icon: SecurityIcon,
      title: 'الوصول الآمن',
      description: 'التحكم في الوصول بناءً على الأدوار للمديرين والمعلمين',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-white',
      delay: '500ms',
    },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,_#0b3a74_0%,_#0a3569_100%)]" dir="rtl">
        {/* Patterned background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-[34rem] h-[34rem] bg-blue-300/8 rounded-full blur-3xl transition-all duration-1000 ease-out"
            style={{
              left: `${mousePosition.x / 24}px`,
              top: `${mousePosition.y / 24}px`,
            }}
          ></div>
          <div className="absolute inset-0 opacity-15" style={{
            backgroundImage: 'repeating-linear-gradient(168deg, transparent 0 26px, rgba(147,197,253,0.22) 26px 28px)',
            transform: 'scale(1.2)',
            transformOrigin: 'top right',
          }}></div>
          <div className="absolute -bottom-24 left-1/2 h-[24rem] w-[46rem] -translate-x-1/2 rounded-[100%] border border-blue-200/10 opacity-40"></div>
          <div className="absolute -bottom-28 left-1/2 h-[30rem] w-[56rem] -translate-x-1/2 rounded-[100%] border border-blue-200/10 opacity-25"></div>
        </div>

        {/* Reduced floating particles - less noise */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/15 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-3 bg-[#f1d980]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fadeIn">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-white">
            <span className="block">
              <span className="text-[#8bc1ff] drop-shadow-sm relative inline-block">
                <span className="relative z-10">معهد</span>
                <span className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-200/25 blur-sm"></span>
              </span>
              {' '}
              <span className="text-white drop-shadow-sm relative inline-block">
                <span className="relative z-10">المرام</span>
              </span>
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl mb-12 text-blue-50/90 font-normal max-w-3xl mx-auto leading-loose">
            كل ما يحتاجه المعهد لإدارة الطلاب والدروس والمدفوعات في مكان واحد، بسهولة واحتراف.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 items-center mb-16">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="secondary" size="lg" className="text-xl px-10 py-5 shadow-xl transform hover:scale-105 transition-all hover:animate-none !bg-none !bg-white hover:!bg-blue-50 !text-[#0b3a74] !shadow-black/20">
                  <span className="flex items-center gap-2">
                    الانتقال إلى لوحة التحكم
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="secondary" size="lg" className="text-xl px-10 py-5 shadow-xl transform hover:scale-110 transition-all hover:animate-none !bg-none !bg-white hover:!bg-blue-50 !text-[#0b3a74] !shadow-black/20">
                  <span className="flex items-center gap-2">
                    ابدأ الآن
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Button>
              </Link>
            )}
            <Link href="/about">
              <Button variant="outline" size="lg" className="text-lg px-6 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white hover:bg-white/15 shadow-md transform hover:scale-105 transition-all">
                اعرف المزيد
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center shadow-lg shadow-black/10 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">👨‍🎓</div>
              <div className="text-blue-50/90 font-semibold text-sm mb-1">عدد الطلاب</div>
              <div className="text-white font-bold text-xl">500+</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center shadow-lg shadow-black/10 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">🧑‍🏫</div>
              <div className="text-blue-50/90 font-semibold text-sm mb-1">معلمون معتمدون</div>
              <div className="text-white font-bold text-xl">+30</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center shadow-lg shadow-black/10 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">🏫</div>
              <div className="text-blue-50/90 font-semibold text-sm mb-1">سنوات الخبرة</div>
              <div className="text-white font-bold text-xl">10+</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern cards */}
      <section className="py-24 bg-[#ddecf8] relative overflow-hidden" dir="rtl">
        {/* Smooth divider from previous section */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#f1d980]"></div>
        
        {/* Very transparent accent circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#0b3a74]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
        
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, #6b7280 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeading
            eyebrow="لماذا منصتنا؟"
            title="المميزات"
            description="اكتشف كيف تساعد المنصة في تنظيم وإدارة المعهد"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.Icon;
              return (
                <div
                  key={feature.title}
                  className={`
                    group relative p-8 rounded-[28px] bg-white/95
                    border border-blue-100/80 shadow-[0_18px_45px_-24px_rgba(11,58,116,0.18)] hover:shadow-[0_22px_55px_-22px_rgba(11,58,116,0.28)]
                    transform hover:scale-[1.02] hover:-translate-y-1
                    transition-all duration-300 overflow-hidden
                    animate-fadeIn
                  `}
                  style={{ animationDelay: feature.delay }}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500`}></div>
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${feature.gradient}`}></div>
                  
                  {/* Icon */}
                  <div className={`
                    relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.gradient}
                    flex items-center justify-center mb-6 shadow-lg mx-auto
                    transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300
                  `}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <div className="mb-3 inline-flex rounded-full bg-[#ddecf8] px-3 py-1 text-xs font-bold text-[#0b3a74]">
                      0{index + 1}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative corner */}
                  <div className={`absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-2xl`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <RulesSection />

      {/* CTA Section - Modern design */}
      <section className="py-24 bg-gradient-to-br from-[#0b3a74] via-[#0a3569] to-[#1b5dab] relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/8 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/15 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading
            eyebrow="ابدأ رحلتك معنا"
            title="هل أنت مستعد للبدء؟"
            description="انضم إلينا اليوم واجعل إدارة معهدك أكثر سهولة وفعالية"
            inverted
          />
          
          {!isAuthenticated && (
            <Link href="/login">
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-10 py-4 !bg-none !bg-white !text-[#1877f2] hover:!bg-blue-50 shadow-2xl transform hover:scale-105 transition-all"
              >
                <span className="flex items-center gap-2">
                  تسجيل الدخول الآن
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Button>
            </Link>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
