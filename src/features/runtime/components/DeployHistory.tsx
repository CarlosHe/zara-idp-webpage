import { Card, CardContent, CardHeader, CardTitle, EmptyState, Spinner } from '@/shared/components/ui';
import type { RuntimeDeploy } from '../types';

interface Props {
  deploys: RuntimeDeploy[];
  loading: boolean;
}

export function DeployHistory({ deploys, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy history</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : deploys.length === 0 ? (
          <EmptyState
            title="No deploy history"
            description="Either no rollouts have been recorded for this workload yet, or the runtime adapter doesn't surface deploy history."
          />
        ) : (
          <ul className="space-y-2 text-sm">
            {deploys.map((d) => (
              <li
                key={d.revision}
                className="border-b border-slate-800 pb-2 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">rev {d.revision}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(d.deployedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-1 truncate">{d.image}</div>
                {d.changeSetId && (
                  <div className="text-slate-600 text-xs mt-1">
                    ChangeSet: {d.changeSetId}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
