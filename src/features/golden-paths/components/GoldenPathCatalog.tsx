import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/shared/components/feedback';
import { Alert } from '@/shared/components/ui';
import {
  categoryLabels,
  goldenPathCategoryOrder,
  goldenPaths,
} from '../data/goldenPaths';
import type { GoldenPath, GoldenPathCategory } from '../types';
import { GoldenPathCard } from './GoldenPathCard';

interface GoldenPathCatalogProps {
  onSelect: (path: GoldenPath) => void;
}

export function GoldenPathCatalog({ onSelect }: GoldenPathCatalogProps) {
  const grouped = useMemo(() => {
    const acc = new Map<GoldenPathCategory, GoldenPath[]>();
    for (const category of goldenPathCategoryOrder) acc.set(category, []);
    for (const path of goldenPaths) acc.get(path.category)?.push(path);
    return Array.from(acc.entries()).filter(([, paths]) => paths.length > 0);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Sparkles className="h-6 w-6" />}
        iconClassName="text-yellow-400"
        title="Golden Paths"
        description="Pre-approved templates for common infrastructure patterns"
      />

      <Alert type="info" title="What are Golden Paths?">
        Golden Paths are pre-configured templates that follow your organization's best practices.
        They help teams quickly create resources while maintaining consistency and compliance.
      </Alert>

      {grouped.map(([category, paths]) => (
        <section key={category} aria-label={categoryLabels[category]}>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            {categoryLabels[category]}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map((path) => (
              <GoldenPathCard key={path.id} path={path} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
