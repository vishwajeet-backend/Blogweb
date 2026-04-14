"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const items = [
  { label: 'User Management', href: '/admin/users' },
  { label: 'All Articles', href: '/admin/articles' },
  { label: 'Moderation', href: '/admin/moderation' },
  { label: 'Profile Settings', href: '/admin/settings' },
];

export function AdminNavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [open, setOpen] = useState(false);

  const isActive = (label: string, href: string) => {
    if (label === 'Moderation') {
      return pathname === '/admin/moderation' || (pathname === '/admin/articles' && mode === 'moderation');
    }
    if (label === 'All Articles') {
      return pathname === '/admin/articles' && mode !== 'moderation';
    }
    return pathname === href;
  };

  return (
    <nav className="mt-4 pb-1">
      <div className="hidden min-w-max gap-2 md:flex">
        {items.map((item) => {
          const active = isActive(item.label, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-[8px] border px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                active
                  ? 'border-[#FB6503] bg-[#FFF0E6] text-[#C2410C]'
                  : 'border-[#E5E7EB] bg-white text-[#57534D] hover:bg-[#FAFAF9]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#57534D]"
          aria-label="Open admin navigation"
        >
          <Menu className="h-4 w-4" /> Admin Navigation
        </button>

        {open ? (
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="Close admin navigation"
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-[86vw] max-w-[320px] border-l border-[#E9E9E9] bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-bold text-[#1E1E1E]">Admin Panel</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-[#57534D] hover:bg-[#F5F5F4]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item) => {
                  const active = isActive(item.label, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-[8px] border px-3 py-2 text-sm font-medium ${
                        active
                          ? 'border-[#FB6503] bg-[#FFF0E6] text-[#C2410C]'
                          : 'border-[#E5E7EB] bg-white text-[#57534D]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
