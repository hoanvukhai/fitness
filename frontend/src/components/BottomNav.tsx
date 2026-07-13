'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, TrendingUp, BookOpen } from 'lucide-react';

const navItems = [
  {
    href: '/',
    icon: CalendarDays,
    label: 'Hôm nay',
  },
  {
    href: '/progress',
    icon: TrendingUp,
    label: 'Tiến độ',
  },
  {
    href: '/reference',
    icon: BookOpen,
    label: 'Tài liệu',
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-6 min-w-[72px] transition-all duration-200 ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-blue-500/15' : ''
                }`}>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-sm" />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="relative"
                  />
                </div>
                <span className={`text-[11px] font-medium tracking-wide ${
                  isActive ? 'text-blue-400' : 'text-slate-500'
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
