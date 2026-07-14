'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, TrendingUp, BookOpen, Library } from 'lucide-react';

const navItems = [
  { href: '/',          icon: CalendarDays, label: 'Hôm nay' },
  { href: '/progress',  icon: TrendingUp,   label: 'Tiến độ' },
  { href: '/library',   icon: Library,      label: 'Bài tập' },
  { href: '/reference', icon: BookOpen,     label: 'Tài liệu' },
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
                className={`flex items-center justify-center p-2 min-w-[64px] transition-all duration-200 ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                  isActive ? 'bg-blue-500/15' : ''
                }`}>
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-sm" />
                  )}
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="relative"
                  />
                  <span className="sr-only">{label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
