import { type ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: string | number;
}

interface SidebarProps {
  items: NavItem[];
  className?: string;
}

export function Sidebar({ items, className = "" }: SidebarProps) {
  return (
    <aside className={`flex w-64 flex-col border-r border-navy-200 bg-white ${className}`}>
      {/* Logo area */}
      <div className="flex h-14 items-center gap-2.5 border-b border-navy-100 px-5">
        <PrismLogo className="h-7 w-7" />
        <span className="text-lg font-bold tracking-tight text-navy-900">
          Prism <span className="text-indigo-600">PM</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150
              ${item.active
                ? "bg-indigo-50 text-indigo-700"
                : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
              }
            `}
          >
            {item.icon && (
              <span className="flex h-5 w-5 items-center justify-center flex-shrink-0">
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-600">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-navy-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-500">
          <div className="h-8 w-8 rounded-full bg-navy-200 flex items-center justify-center text-xs font-bold text-navy-600">
            PM
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-navy-700">Alex Chen</p>
            <p className="text-xs text-navy-400">Project Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function NavBar({ items, className = "" }: { items: NavItem[]; className?: string }) {
  return (
    <nav className={`flex items-center gap-1 ${className}`}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={`
            flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150
            ${item.active
              ? "bg-indigo-50 text-indigo-700"
              : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
            }
          `}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function PrismLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Prism PM">
      {/* Triangle prism */}
      <path
        d="M16 2L30 26H2L16 2Z"
        className="fill-indigo-600"
        opacity="0.9"
      />
      {/* Light splitting through prism */}
      <path
        d="M16 10L22 22H10L16 10Z"
        className="fill-amber-400"
        opacity="0.8"
      />
      {/* Light ray entering */}
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="8"
        className="stroke-amber-400"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Spectral lines coming out */}
      <line x1="10" y1="22" x2="8" y2="26" className="stroke-indigo-400" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="16" y1="22" x2="16" y2="26" className="stroke-emerald-400" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="22" y1="22" x2="24" y2="26" className="stroke-amber-400" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/* ─── Icon components ─── */

export function IconDashboard({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconCalendar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconAlert({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function IconUsers({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function IconSettings({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function IconChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconSparkles({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M18 15l-1.5 4.5L12 21l4.5-1.5L18 15z" />
    </svg>
  );
}