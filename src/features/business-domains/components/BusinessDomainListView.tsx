import { Building2, Search } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import { DataEmptyState } from '@/shared/components/feedback';
import { BusinessDomainCard } from './BusinessDomainCard';
import type { BusinessDomain } from './types';

export interface BusinessDomainListViewProps {
  domains: BusinessDomain[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedTier: number | null;
  onTierChange: (tier: number | null) => void;
  selectedDomain: BusinessDomain | null;
  onSelect: (domain: BusinessDomain) => void;
  onEdit: (domain: BusinessDomain) => void;
  onDelete: (domain: BusinessDomain) => void;
}

const TIER_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'All Tiers', value: null },
  { label: 'Tier 1', value: 1 },
  { label: 'Tier 2', value: 2 },
  { label: 'Tier 3', value: 3 },
];

export function BusinessDomainListView({
  domains,
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
  selectedDomain,
  onSelect,
  onEdit,
  onDelete,
}: BusinessDomainListViewProps) {
  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search domains by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {TIER_OPTIONS.map((option) => (
            <Button
              key={option.label}
              variant={selectedTier === option.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onTierChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {domains.length === 0 ? (
          <DataEmptyState
            icon={<Building2 className="h-8 w-8 text-slate-400" />}
            title="No business domains found"
            description="No domains match your current filters."
          />
        ) : (
          domains.map((domain) => (
            <BusinessDomainCard
              key={domain.id}
              domain={domain}
              isSelected={selectedDomain?.id === domain.id}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </>
  );
}
