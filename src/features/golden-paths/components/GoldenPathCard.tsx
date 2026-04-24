import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui';
import type { GoldenPath } from '../types';

interface GoldenPathCardProps {
  path: GoldenPath;
  onSelect: (path: GoldenPath) => void;
}

export function GoldenPathCard({ path, onSelect }: GoldenPathCardProps) {
  const Icon = path.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(path)}
      className="text-left w-full group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="cursor-pointer hover:bg-slate-700/50 transition-colors h-full">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                {path.name}
              </h3>
              <p className="text-sm text-slate-400 mt-1">{path.description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-blue-400 transition-colors" aria-hidden />
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
