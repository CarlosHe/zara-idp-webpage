import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useTheme } from '../hooks/useTheme';
import type { ThemeMode } from '../store/themeSlice';

interface ThemeToggleProps {
  className?: string;
}

interface Option {
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}

const options: ReadonlyArray<Option> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { mode, setMode } = useTheme();
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-slate-700/50 bg-slate-800/40 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            title={option.label}
            onClick={() => setMode(option.value)}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-slate-700/80 text-white'
                : 'hover:bg-slate-700/40 hover:text-slate-200',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
