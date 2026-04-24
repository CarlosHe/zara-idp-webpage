import { Badge, TableCell, TableRow } from '@/shared/components/ui';
import type { TeamMember } from '@/shared/types';

interface TeamMemberRowProps {
  member: TeamMember;
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-500/20 text-purple-400',
  maintainer: 'bg-blue-500/20 text-blue-400',
  developer: 'bg-green-500/20 text-green-400',
  viewer: 'bg-slate-500/20 text-slate-400',
};

export function TeamMemberRow({ member }: TeamMemberRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-sm text-slate-300">{member.name?.[0] || '?'}</span>
          </div>
          <span className="font-medium">{member.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{member.email}</span>
      </TableCell>
      <TableCell>
        <Badge className={ROLE_COLORS[member.role] || ROLE_COLORS.viewer}>
          {member.role}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
