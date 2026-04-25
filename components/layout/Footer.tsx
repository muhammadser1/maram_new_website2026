import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-[#0b3a74] via-[#0a3569] to-[#1b5dab] text-white relative overflow-hidden" dir="rtl">
      {/* Decorative elements */}
      <svg
        className="absolute top-0 left-0 w-full h-16 text-[#ddecf8]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,64L60,58.7C120,53,240,43,360,37.3C480,32,600,32,720,42.7C840,53,960,75,1080,74.7C1200,75,1320,53,1380,42.7L1440,32L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
        ></path>
      </svg>
      <div className="absolute top-0 left-0 w-full h-2 bg-[#f1d980]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white to-blue-100 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-2xl font-extrabold">
                <span className="text-white">معهد</span>
                {' '}
                <span className="text-blue-100">المرام</span>
              </h3>
            </div>
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              نظام إدارة شامل للمعاهد الخاصة، يوفر أدوات فعالة لإدارة المعلمين والطلاب
              والدروس والمدفوعات.
            </p>
            <a
              href="https://www.instagram.com/serhanmaram"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              aria-label="إنستغرام - @serhanmaram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">من نحن</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">اتصل بنا</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">تسجيل الدخول</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white">معلومات الاتصال</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors font-semibold">0527541072</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors flex-shrink-0">
                  <span className="text-blue-100">👤</span>
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors font-semibold">مرام سرحان</span>
              </li>
            </ul>
            <p className="mt-6 text-gray-300 text-sm leading-relaxed">
              معلومات الاتصال في حال واجهتك أي مشكلة بالموقع:
            </p>
            <div className="mt-3 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <span className="text-gray-300 group-hover:text-white transition-colors font-semibold">0538250579 محمد سراحنة</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {currentYear} <span className="text-blue-100 font-semibold">معهد المرام</span>. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}

