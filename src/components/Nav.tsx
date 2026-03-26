'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/venues', label: 'Venues' },
    { href: '/events', label: 'Events' },
  ];

  return (
    <nav className="border-b border-[#1a1a1a] bg-[#080808] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-xl tracking-widest text-white">
            BAND<span className="text-[#4d65ff]">TRACKER</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  path === l.href
                    ? 'text-white bg-[#1a1a1a]'
                    : 'text-[#666] hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="text-xs text-[#444] font-mono">by 237 Global</div>
      </div>
    </nav>
  );
}
