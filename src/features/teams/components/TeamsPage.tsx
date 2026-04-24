import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Phone,
  ExternalLink,
  ArrowLeft,
  Box,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  useListTeamsQuery,
  useGetTeamQuery,
  useGetTeamOnCallQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} from '@/features/teams/services/teamsApi';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Alert,
  Input,
  Modal,
  ConfirmModal,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState } from '@/shared/components/feedback';
import type { Team, TeamMember } from '@/shared/types';

// Team Form Modal
interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team | null;
}

function TeamFormModal({ isOpen, onClose, team }: TeamFormModalProps) {
  const dispatch = useAppDispatch();
  const { saving, saveError } = useAppSelector((state) => state.teams);
  
  // Derive initial state from team prop - reset when team changes
  const getInitialFormData = () => ({
    metadata: { name: team?.metadata?.name || '' },
    spec: { 
      displayName: team?.spec?.displayName || '',
      channels: { general: team?.spec?.channels?.general || '' }
    },
  });
  
  const [formData, setFormData] = useState(getInitialFormData());
  
  // Track the team ID to detect when we need to reset
  const [prevTeamId, setPrevTeamId] = useState<string | undefined>(team?.id);
  
  // Reset form when team changes
  useEffect(() => {
    if (team?.id !== prevTeamId) {
      setPrevTeamId(team?.id);
      setFormData(getInitialFormData());
    }
  }, [team?.id, prevTeamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (team?.id) {
      const result = await dispatch(updateTeam({ 
        id: team.id, 
        data: { 
          displayName: formData.spec.displayName,
          slackChannel: formData.spec.channels.general,
        } 
      }));
      if (!result.type.endsWith('/rejected')) {
        onClose();
      }
    } else {
      const result = await dispatch(createTeam({
        name: formData.metadata.name,
        displayName: formData.spec.displayName,
        slackChannel: formData.spec.channels.general,
      }));
      if (!result.type.endsWith('/rejected')) {
        onClose();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={team ? 'Edit Team' : 'Create Team'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {saveError && (
          <Alert type="error" title="Error">
            {saveError}
          </Alert>
        )}
        
        <Input
          id="name"
          label="Name"
          value={formData.metadata.name}
          onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, name: e.target.value } })}
          placeholder="platform-team"
          required
          disabled={!!team}
        />

        <Input
          id="displayName"
          label="Display Name"
          value={formData.spec.displayName}
          onChange={(e) => setFormData({ ...formData, spec: { ...formData.spec, displayName: e.target.value } })}
          placeholder="Platform Engineering Team"
          required
        />
        
        <Input
          id="channels.general"
          label="Channel"
          value={formData.spec.channels.general}
          onChange={(e) => setFormData({ ...formData, spec: { ...formData.spec, channels: { general: e.target.value } } })}
          placeholder="#platform-team"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {team ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TeamsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error, saving } = useAppSelector((state) => state.teams);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  const handleCreate = () => {
    setEditingTeam(null);
    dispatch(clearSaveError());
    setIsFormOpen(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    dispatch(clearSaveError());
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingTeam?.id) {
      await dispatch(deleteTeam(deletingTeam.id));
      setDeletingTeam(null);
    }
  };

  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => dispatch(fetchTeams())} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<Users className="h-6 w-6" />}
        iconClassName="text-indigo-400"
        title="Teams"
        description="Manage team ownership and on-call information"
        onRefresh={() => dispatch(fetchTeams())}
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        }
      />

      {/* Teams Grid */}
      {loading ? (
        <LoadingState message="Loading teams..." iconClassName="text-indigo-400" />
      ) : !Array.isArray(items) || items.length === 0 ? (
        <DataEmptyState
          icon={<Users className="h-6 w-6 text-slate-500" />}
          title="No teams found"
          description="Teams will appear here once configured."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team} 
              onEdit={handleEdit}
              onDelete={setDeletingTeam}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <TeamFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        team={editingTeam}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        onConfirm={handleDelete}
        title="Delete Team"
        message={`Are you sure you want to delete the team "${deletingTeam?.spec.displayName || deletingTeam?.metadata.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
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
                <h3 className="font-medium text-white">{team.spec.displayName || team.metadata.name}</h3>
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

// Team Detail Page
export function TeamDetailPage() {
  const { name } = useParams<{ name: string }>();
  const dispatch = useAppDispatch();
  const { selectedTeam, onCall, loading, error } = useAppSelector((state) => state.teams);

  useEffect(() => {
    if (name) {
      dispatch(fetchTeam(name));
      dispatch(fetchTeamOnCall(name));
    }
    return () => {
      dispatch(clearSelectedTeam());
    };
  }, [dispatch, name]);

  if (loading && !selectedTeam) {
    return <LoadingState message="Loading team..." />;
  }

  if (error) {
    return (
      <Alert type="error" title="Failed to load team">
        {error}
      </Alert>
    );
  }

  if (!selectedTeam) {
    return (
      <DataEmptyState
        icon={<Users className="h-6 w-6 text-slate-500" />}
        title="Team not found"
        description="The requested team could not be found."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link to={ROUTES.TEAMS.LIST} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to teams
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{selectedTeam.spec.displayName}</h1>
            <p className="text-slate-400">{selectedTeam.metadata.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTeam.spec.channels.general && (
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-400">Channel</p>
                  <p className="text-slate-200">{selectedTeam.spec.channels.general}</p>
                </div>
              </div>
            )}
            {selectedTeam.pagerDutyService && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-400">PagerDuty Service</p>
                  <a
                    href={`https://pagerduty.com/services/${selectedTeam.pagerDutyService}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {selectedTeam.pagerDutyService}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* On-Call */}
        <Card>
          <CardHeader>
            <CardTitle>On-Call</CardTitle>
          </CardHeader>
          <CardContent>
            {onCall ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Primary</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-sm text-emerald-400">
                        {onCall.primary?.name?.[0] || 'P'}
                      </span>
                    </div>
                    <span className="text-slate-200">
                      {onCall.primary?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
                {onCall.secondary && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Secondary</p>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-sm text-blue-400">
                          {onCall.secondary.name?.[0] || 'S'}
                        </span>
                      </div>
                      <span className="text-slate-200">{onCall.secondary.name}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No on-call schedule configured</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({selectedTeam.members?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTeam.members && selectedTeam.members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTeam.members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <DataEmptyState
              title="No members"
              description="This team has no members configured."
              compact
            />
          )}
        </CardContent>
      </Card>

      {/* Team Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resources</CardTitle>
            <Link to={`${ROUTES.RESOURCES.LIST}?team=${selectedTeam.metadata.name}`}>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <DataEmptyState
            icon={<Box className="h-6 w-6 text-slate-500" />}
            title="Resources not loaded"
            description="Click 'View all' to see resources owned by this team."
            compact
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface MemberRowProps {
  member: TeamMember;
}

function MemberRow({ member }: MemberRowProps) {
  const roleColors: Record<string, string> = {
    owner: 'bg-purple-500/20 text-purple-400',
    maintainer: 'bg-blue-500/20 text-blue-400',
    developer: 'bg-green-500/20 text-green-400',
    viewer: 'bg-slate-500/20 text-slate-400',
  };

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
        <Badge className={roleColors[member.role] || roleColors.viewer}>
          {member.role}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
