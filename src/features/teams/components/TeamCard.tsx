import { Link } from 'react-router-dom';
import { Users, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui';
import { ROUTES } from '@/shared/config';
import type { Team } from '@/shared/types';

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  const displayName = team.spec.displayName || team.metadata.name;

  return (
    <div className="relative group">
      <Link
        to={ROUTES.TEAMS.DETAIL(team.metadata.name)}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        aria-label={`Open team ${displayName}`}
      >
        <Card className="hover:bg-slate-700/50 transition-colors cursor-pointer h-full">
          <CardContent>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  aria-hidden
                  className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center"
                >
                  <Users className="h-5 w-5 text-indigo-400" aria-hidden />
                </div>
                <div>
                  <h3 className="font-medium text-white">{displayName}</h3>
                  <p className="text-xs text-slate-400">{team.metadata.name}</p>
                </div>
              </div>
              {/* space for action buttons (positioned absolutely below) */}
              <div className="w-[72px]" aria-hidden />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {team.members?.length || 0} members
              </span>
              <span className="text-sm text-slate-400">
                {team.resourceCount || 0} resources
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="absolute top-4 right-4 flex gap-1">
        <button
          type="button"
          onClick={() => onEdit(team)}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Edit team ${displayName}`}
          title={`Edit team ${displayName}`}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onDelete(team)}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Delete team ${displayName}`}
          title={`Delete team ${displayName}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
