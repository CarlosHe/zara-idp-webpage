import { Link, useParams } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Phone,
  ExternalLink,
  ArrowLeft,
  Box,
} from 'lucide-react';
import {
  useGetTeamQuery,
  useGetTeamOnCallQuery,
} from '@/features/teams/services/teamsApi';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import {
  Alert,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import type { OnCallInfo, Team } from '@/shared/types';
import { TeamMemberRow } from './TeamMemberRow';

export function TeamDetailView() {
  const { name } = useParams<{ name: string }>();
  const {
    data: selectedTeam,
    isLoading: loading,
    error,
  } = useGetTeamQuery(name ?? '', { skip: !name });
  const { data: onCall } = useGetTeamOnCallQuery(name ?? '', { skip: !name });

  if (loading && !selectedTeam) {
    return <LoadingState message="Loading team..." />;
  }

  if (error) {
    return (
      <Alert type="error" title="Failed to load team">
        {errorMessage(error) || 'Unable to load team details.'}
      </Alert>
    );
  }

  if (!selectedTeam) {
    return (
      <DataEmptyState
        icon={<Users className="h-6 w-6 text-slate-400" />}
        title="Team not found"
        description="The requested team could not be found."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        to={ROUTES.TEAMS.LIST}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to teams
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {selectedTeam.spec.displayName}
            </h1>
            <p className="text-slate-400">{selectedTeam.metadata.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TeamInfoCard team={selectedTeam} />
        <TeamOnCallCard onCall={onCall} />
      </div>

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
                  <TeamMemberRow key={member.id} member={member} />
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resources</CardTitle>
            <Link
              to={`${ROUTES.RESOURCES.LIST}?team=${selectedTeam.metadata.name}`}
              aria-label={`View all resources owned by ${selectedTeam.metadata.name}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <DataEmptyState
            icon={<Box className="h-6 w-6 text-slate-400" />}
            title="Resources not loaded"
            description="Click 'View all' to see resources owned by this team."
            compact
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TeamInfoCard({ team }: { team: Team }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Team Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {team.spec.channels.general && (
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-400">Channel</p>
              <p className="text-slate-200">{team.spec.channels.general}</p>
            </div>
          </div>
        )}
        {team.pagerDutyService && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-400">PagerDuty Service</p>
              <a
                href={`https://pagerduty.com/services/${team.pagerDutyService}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {team.pagerDutyService}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamOnCallCard({ onCall }: { onCall: OnCallInfo | undefined }) {
  return (
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
  );
}
