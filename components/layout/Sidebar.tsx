'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  hideForTeachers?: boolean;
}

function SidebarIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-50 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/15">
      {children}
    </span>
  );
}

const navigation: NavItem[] = [
  {
    name: 'الدروس',
    href: '/dashboard/lessons',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v11.494m-7-8.994v6.494c0 .733.393 1.41 1.03 1.775l5.5 3.15a2 2 0 001.94 0l5.5-3.15A2.05 2.05 0 0020 15.247V8.753c0-.733-.393-1.41-1.03-1.775l-5.5-3.15a2 2 0 00-1.94 0l-5.5 3.15A2.05 2.05 0 005 8.753z" />
        </svg>
      </SidebarIcon>
    ),
  },
  {
    name: 'احصائيات المعلمين',
    href: '/dashboard/statistics',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 20V10m5 10V4m5 16v-7" />
        </svg>
      </SidebarIcon>
    ),
  },
  {
    name: 'التقارير',
    href: '/dashboard/reports',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-6m3 6V7m3 10v-3m5 6H4a1 1 0 01-1-1V5a1 1 0 011-1h16a1 1 0 011 1v14a1 1 0 01-1 1z" />
        </svg>
      </SidebarIcon>
    ),
    adminOnly: true,
  },
  {
    name: 'المدفوعات',
    href: '/dashboard/payments',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h.01M11 15h2m-9 4h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1z" />
        </svg>
      </SidebarIcon>
    ),
    adminOnly: true,
  },
  {
    name: 'التسعير',
    href: '/dashboard/pricing',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-10V6m0 12v-2" />
        </svg>
      </SidebarIcon>
    ),
    adminOnly: true,
  },
  {
    name: 'الطلاب',
    href: '/dashboard/students',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 18v-1a4 4 0 00-8 0v1m4-7a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      </SidebarIcon>
    ),
    adminOnly: true,
  },
  {
    name: 'المعلمون',
    href: '/dashboard/teachers',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422M12 14v6" />
        </svg>
      </SidebarIcon>
    ),
    adminOnly: true,
  },
  {
    name: 'الإعدادات',
    href: '/dashboard/settings',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317a1 1 0 011.35-.936l1.452.58a1 1 0 001.05-.21l1.06-1.06a1 1 0 011.414 0l1.768 1.768a1 1 0 010 1.414l-1.06 1.06a1 1 0 00-.21 1.05l.58 1.452a1 1 0 01-.936 1.35h-1.5a1 1 0 00-.95.684l-.49 1.47a1 1 0 01-.95.684h-2a1 1 0 01-.95-.684l-.49-1.47a1 1 0 00-.95-.684h-1.5a1 1 0 01-.936-1.35l.58-1.452a1 1 0 00-.21-1.05l-1.06-1.06a1 1 0 010-1.414l1.768-1.768a1 1 0 011.414 0l1.06 1.06a1 1 0 001.05.21l1.452-.58z" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.8} />
        </svg>
      </SidebarIcon>
    ),
    adminOnly: true,
  },
  {
    name: 'الملف الشخصي',
    href: '/dashboard/profile',
    icon: (
      <SidebarIcon>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 18v-1a4 4 0 00-8 0v1m4-7a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      </SidebarIcon>
    ),
    hideForTeachers: true,
  },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isMobile = false, onClose, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, isTeacher, logout } = useAuth();

  const filteredNav = navigation.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.hideForTeachers && isTeacher) return false;
    return true;
  });

  const handleNavClick = useCallback(() => {
    if (isMobile) {
      onClose?.();
    }
  }, [isMobile, onClose]);

  return (
    <div className={`w-64 bg-[linear-gradient(180deg,_#0b3a74_0%,_#0a3569_45%,_#10263d_100%)] text-white ${isMobile ? 'h-full' : 'min-h-screen'} relative flex flex-col shadow-2xl ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-[#f1d980]/10 pointer-events-none"></div>
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(168deg, transparent 0 26px, rgba(147,197,253,0.22) 26px 28px)',
          transform: 'scale(1.12)',
          transformOrigin: 'top right',
        }}
      ></div>
      
      <div className="p-6 flex items-center justify-between flex-shrink-0 relative z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[linear-gradient(135deg,_#17c6c2_0%,_#1495b0_100%)] flex items-center justify-center shadow-lg shadow-cyan-950/30">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422M12 14v6" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">معهد المرام</h2>
            <p className="text-xs text-blue-100/70">لوحة التحكم</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-2 transition-colors"
            aria-label="إغلاق القائمة"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <nav className="mt-4 flex-1 overflow-y-auto px-3 relative z-10">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl transition-all duration-300 border
                ${isActive 
                  ? 'border-cyan-300/20 bg-[linear-gradient(135deg,_#18c6bf_0%,_#17b8b6_45%,_#1f7cb0_100%)] text-white shadow-[0_16px_36px_-18px_rgba(24,198,191,0.8)]'
                  : 'border-transparent text-blue-50/80 hover:bg-white/8 hover:text-white hover:border-white/10'
                }
              `}
              onClick={handleNavClick}
            >
              <span className={`transition-transform ${isActive ? 'scale-105' : ''}`}>
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.name}</span>
              </div>
              {isActive && (
                <div className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]"></div>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto w-full p-6 flex-shrink-0 relative z-10 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white font-semibold backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

