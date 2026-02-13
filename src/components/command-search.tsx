'use client';

import {
  Analytics01Icon,
  ChartRadarIcon,
  DashboardSquare02Icon,
  Search02Icon,
  Settings01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const pages = [
  { title: 'Overview', href: '/', icon: DashboardSquare02Icon },
  { title: 'Influencers', href: '/influencers', icon: UserGroupIcon },
  { title: 'Analytics', href: '/analytics', icon: Analytics01Icon },
  { title: 'Reports', href: '/reports', icon: ChartRadarIcon },
  { title: 'Channel Lookup', href: '/channel-lookup', icon: Search02Icon },
  { title: 'Settings', href: '/settings', icon: Settings01Icon },
];

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = pages.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-page-enter">
        {/* Search input */}
        <div className="flex items-center border-b border-border px-4">
          <HugeiconsIcon
            icon={Search02Icon}
            size={16}
            className="text-muted-foreground"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          ) : (
            filtered.map((page, i) => (
              <button
                key={page.href}
                onClick={() => navigate(page.href)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  i === selectedIndex
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <HugeiconsIcon icon={page.icon} size={16} />
                <span>{page.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
