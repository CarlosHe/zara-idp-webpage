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
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(team);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(team);
  };

  return (
    <Link to={ROUTES.TEAMS.DETAIL(team.metadata.name)}>
      <Card className="hover:bg-slate-700/50 transition-colors cursor-pointer h-full">
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  {team.spec.displayName || team.metadata.name}
                </h3>
                <p className="text-xs text-slate-400">{team.metadata.name}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                title="Edit team"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                title="Delete team"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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
  );
}
