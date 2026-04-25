'use client';

type Rule = {
  icon: string;
  title: string;
  description: string;
};

const rules: Rule[] = [
  {
    icon: '⏰',
    title: 'الالتزام بالمواعيد',
    description:
      'يجب الالتزام بمواعيد الدروس والحضور في الوقت المحدد.',
  },
  {
    icon: '🤐',
    title: 'الهدوء والانضباط',
    description:
      'الحفاظ على الهدوء والانضباط داخل قاعات الدراسة.',
  },
  {
    icon: '📵',
    title: 'إغلاق الهاتف',
    description:
      'إغلاق الهاتف المحمول أو وضعه على الوضع الصامت أثناء الدرس.',
  },
  {
    icon: '📝',
    title: 'إكمال الواجبات',
    description:
      'إكمال جميع الواجبات والأنشطة في الوقت المحدد.',
  },
  {
    icon: '🤝',
    title: 'الاحترام المتبادل',
    description:
      'التعامل باحترام متبادل بين الطلاب والمعلمين والإداريين.',
  },
  {
    icon: '🚫',
    title: 'منع الغياب',
    description:
      'إعلام المعهد مسبقاً في حالة الغياب مع عذر مقبول.',
  },
];

export function RulesSection() {
  return (
    <section className="relative py-16 bg-white" dir="rtl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #1d4ed8 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      ></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-blue-100 bg-[#ddecf8]/80 px-5 py-2 text-sm font-semibold text-[#0b3a74] shadow-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1b5dab]"></span>
            بيئة تعليمية منظمة
          </div>
          <h2 className="relative text-4xl md:text-5xl font-black text-center mb-4 text-slate-800 tracking-tight">
            قوانين المعهد
          </h2>
          <div className="mb-4 flex justify-center">
            <span className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></span>
          </div>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            قواعد واضحة تساعد على خلق بيئة تعليمية مريحة، منظمة، وتحفّز على النجاح.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rules.map((rule, index) => (
            <div
              key={rule.title}
              className="group relative overflow-hidden rounded-[28px] border border-blue-100 bg-white p-8 text-center shadow-[0_18px_45px_-24px_rgba(11,58,116,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_-22px_rgba(11,58,116,0.24)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
              <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#ddecf8] blur-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"></div>

              <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,_#0b3a74_0%,_#1b5dab_100%)] text-5xl shadow-lg shadow-blue-200/80">
                {rule.icon}
              </div>
              <div className="relative z-10 mb-3 inline-flex rounded-full bg-[#ddecf8] px-3 py-1 text-xs font-bold text-[#0b3a74]">
                0{index + 1}
              </div>
              <h3 className="relative z-10 text-2xl font-bold mb-3 text-slate-900">
                {rule.title}
              </h3>
              <p className="relative z-10 text-slate-600 leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


