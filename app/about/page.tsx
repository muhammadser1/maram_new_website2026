import { PublicLayout } from '@/components/layout/PublicLayout';

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="bg-[linear-gradient(180deg,_#ddecf8_0%,_#ffffff_38%,_#eef6fc_100%)] py-16" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,_#0b3a74_0%,_#0a3569_100%)] px-6 py-16 mb-14 text-center shadow-[0_24px_60px_-28px_rgba(11,58,116,0.45)]">
            <div className="absolute inset-0 opacity-15" style={{
              backgroundImage: 'repeating-linear-gradient(168deg, transparent 0 26px, rgba(147,197,253,0.22) 26px 28px)',
              transform: 'scale(1.2)',
              transformOrigin: 'top right',
            }}></div>
            <div className="absolute inset-x-0 bottom-0 h-3 bg-[#f1d980]"></div>
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-blue-50/90 shadow-sm backdrop-blur-md">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f1d980]"></span>
                تعرّف على قصتنا
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
                من <span className="text-[#8bc1ff]">نحن</span>
              </h1>
              <div className="mb-5 flex justify-center">
                <span className="h-1.5 w-24 rounded-full bg-gradient-to-r from-white/80 via-[#f1d980] to-white/80"></span>
              </div>
              <p className="text-xl text-blue-50/90 max-w-3xl mx-auto leading-relaxed">
                تعرف على المزيد عن معهد المرام، رؤيتنا، ورسالتنا في تقديم تجربة تعليمية عالية الجودة.
              </p>
            </div>
          </div>

          {/* Mission Section */}
          <div className="mb-8 group">
            <div className="relative p-10 rounded-3xl bg-white/90 border border-blue-100 shadow-[0_20px_50px_-28px_rgba(11,58,116,0.22)] hover:shadow-[0_28px_60px_-28px_rgba(11,58,116,0.28)] transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#1b5dab]/10 rounded-bl-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8bc1ff]/20 rounded-tr-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0b3a74] to-[#1b5dab] flex items-center justify-center shadow-lg shadow-blue-200/80">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <div>
                    <div className="mb-1 inline-flex rounded-full bg-[#ddecf8] px-3 py-1 text-xs font-bold text-[#0b3a74]">رسالتنا</div>
                    <h2 className="text-3xl font-black text-[#0b3a74]">مهمتنا</h2>
                  </div>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed pr-4">
                  مهمتنا هي تقديم خدمات تعليمية استثنائية من خلال نظام إدارة شامل
                  يمكّن المعلمين ويدعم الطلاب ويضمن العمليات الفعالة. نحن ملتزمون
                  بالتميز في التعليم والتحسين المستمر في جميع جوانب معهد المرام.
                </p>
              </div>
            </div>
          </div>

          {/* Vision Section */}
          <div className="mb-8 group">
            <div className="relative p-10 rounded-3xl bg-white/90 border border-blue-100 shadow-[0_20px_50px_-28px_rgba(11,58,116,0.22)] hover:shadow-[0_28px_60px_-28px_rgba(11,58,116,0.28)] transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#f1d980] via-[#1b5dab] to-[#0b3a74]"></div>
              <div className="absolute top-0 left-0 w-40 h-40 bg-[#f1d980]/18 rounded-br-full blur-2xl"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#1b5dab]/10 rounded-tl-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f1d980] to-[#d5b74f] flex items-center justify-center shadow-lg shadow-amber-100">
                    <span className="text-3xl">👁️</span>
                  </div>
                  <div>
                    <div className="mb-1 inline-flex rounded-full bg-[#fff5cf] px-3 py-1 text-xs font-bold text-[#9b7b10]">اتجاهنا</div>
                    <h2 className="text-3xl font-black text-[#9b7b10]">رؤيتنا</h2>
                  </div>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed pr-4">
                  أن نصبح مؤسسة تعليمية رائدة تجمع بين طرق التدريس التقليدية والتكنولوجيا
                  الحديثة، مما يخلق بيئة يمكن للطلاب فيها أن يزدهروا، والمعلمون أن يتفوقوا،
                  والمجتمع أن يستفيد من التعليم عالي الجودة.
                </p>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-blue-100 bg-white/80 px-5 py-2 text-sm font-semibold text-[#0b3a74] shadow-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1b5dab]"></span>
                المبادئ الأساسية
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">قيمنا</h2>
              <div className="mb-4 flex justify-center">
                <span className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#f1d980]"></span>
              </div>
              <p className="text-gray-600 text-lg">المبادئ الأساسية التي توجه عملنا</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Excellence Card */}
              <div className="group relative p-8 rounded-[28px] bg-white border border-blue-100 shadow-lg hover:shadow-2xl hover:shadow-blue-100/70 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0b3a74] via-[#1b5dab] to-[#8bc1ff]"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#1b5dab]/10 rounded-bl-full"></div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0b3a74] to-[#1b5dab] flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#0b3a74]">التميز</h3>
                  <p className="text-gray-700 leading-relaxed">
                    نسعى للتميز في كل ما نقوم به، من التدريس إلى الإدارة.
                  </p>
                </div>
              </div>

              {/* Integrity Card */}
              <div className="group relative p-8 rounded-[28px] bg-white border border-blue-100 shadow-lg hover:shadow-2xl hover:shadow-blue-100/70 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#f1d980] via-[#d5b74f] to-[#0b3a74]"></div>
                <div className="absolute top-0 left-0 w-24 h-24 bg-[#f1d980]/18 rounded-br-full"></div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f1d980] to-[#d5b74f] flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <span className="text-4xl">🤝</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#9b7b10]">النزاهة</h3>
                  <p className="text-gray-700 leading-relaxed">
                    نحافظ على أعلى معايير الصدق والسلوك الأخلاقي.
                  </p>
                </div>
              </div>

              {/* Innovation Card */}
              <div className="group relative p-8 rounded-[28px] bg-white border border-blue-100 shadow-lg hover:shadow-2xl hover:shadow-blue-100/70 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1b5dab] via-[#0b3a74] to-[#f1d980]"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full"></div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <span className="text-4xl">📚</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#1b5dab]">الابتكار</h3>
                  <p className="text-gray-700 leading-relaxed">
                    نتبنى طرق التدريس المبتكرة والتكنولوجيا الحديثة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="mb-8 group">
            <div className="relative p-10 rounded-3xl bg-white/90 border border-blue-100 shadow-[0_20px_50px_-28px_rgba(11,58,116,0.22)] hover:shadow-[0_28px_60px_-28px_rgba(11,58,116,0.28)] transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-500 via-slate-700 to-[#0b3a74]"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100/20 to-transparent"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-slate-400/10 rounded-bl-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">📖</span>
                  </div>
                  <div>
                    <div className="mb-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">نبذة</div>
                    <h2 className="text-3xl font-black text-gray-900">تاريخنا</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-800 text-lg leading-relaxed pr-4">
                    تأسس معهدنا بشغف للتعليم، وقد خدم المجتمع لسنوات عديدة. بدأنا بهدف
                    بسيط: تقديم تعليم عالي الجودة في بيئة داعمة.
                  </p>
                  <p className="text-gray-800 text-lg leading-relaxed pr-4">
                    على مر السنين، نما معهدنا وتطور، واعتمد تقنيات ومنهجيات جديدة لخدمة
                    طلابنا ومعلمينا بشكل أفضل. اليوم، نواصل البناء على أساس التميز بينما
                    نتطلع إلى مستقبل أكثر إشراقاً.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Teachers Section */}
          <div className="mt-8 group">
            <div className="relative p-10 rounded-3xl bg-white/90 border border-blue-100 shadow-[0_20px_50px_-28px_rgba(11,58,116,0.22)] hover:shadow-[0_28px_60px_-28px_rgba(11,58,116,0.28)] transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-[#1b5dab] to-[#f1d980]"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-bl-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8bc1ff]/20 rounded-tr-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-[#1b5dab] flex items-center justify-center shadow-lg">
                    <span className="text-3xl">👨‍🏫</span>
                  </div>
                  <div>
                    <div className="mb-1 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">فريقنا</div>
                    <h2 className="text-3xl font-black text-gray-900">معلمونا</h2>
                  </div>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed pr-4">
                  نحن فخورون بفريقنا من المعلمين المتميزين الذين يجلبون سنوات من الخبرة والشغف للتعليم.
                  معلمونا ملتزمون بتقديم تعليم عالي الجودة وخلق بيئة تعليمية محفزة وداعمة للطلاب.
                  نحن نؤمن بأن المعلمين هم العمود الفقري لنجاحنا، ونسعى جاهدين لتوفير الدعم والموارد
                  اللازمة لتمكينهم من تحقيق أفضل النتائج مع طلابهم.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
