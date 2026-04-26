import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/components/ui';
import type { SavedSearch } from '../types';

interface SavedSearchesProps {
  items: SavedSearch[] | undefined;
  isLoading: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onApply: (saved: SavedSearch) => void;
  onDelete: (id: string) => void;
}

export function SavedSearches({
  items,
  isLoading,
  name,
  onNameChange,
  onSave,
  onApply,
  onDelete,
}: SavedSearchesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved searches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Save as…"
            aria-label="Saved search name"
          />
          <Button type="button" size="sm" onClick={onSave} disabled={!name.trim()}>
            Save
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading saved searches…</p>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-slate-400">No saved searches yet.</p>
        ) : (
          <ul className="space-y-2" aria-label="Saved searches list">
            {items.map((saved) => (
              <li
                key={saved.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/60 p-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">{saved.name}</span>
                  <span className="text-xs text-slate-400">{saved.text || '—'}</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => onApply(saved)}>
                    Apply
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete(saved.id)}
                    aria-label={`Delete saved search ${saved.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
