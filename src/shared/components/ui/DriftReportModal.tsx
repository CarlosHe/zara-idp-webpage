import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import type { DriftReport, DriftSeverity, ChangeType } from '@/shared/types';
import { cn } from '@/shared/utils';

interface DriftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  driftReport: DriftReport | null;
  onReconcile?: () => void;
  isReconciling?: boolean;
}

const severityConfig: Record<DriftSeverity, { color: string; bgColor: string; icon: React.ReactNode }> = {
  NONE: { 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-900/50', 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  LOW: { 
    color: 'text-green-400', 
    bgColor: 'bg-green-900/20', 
    icon: <AlertTriangle className="h-4 w-4" /> 
  },
  MEDIUM: { 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-900/20', 
    icon: <AlertTriangle className="h-4 w-4" /> 
  },
  HIGH: { 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-900/20', 
    icon: <AlertTriangle className="h-4 w-4" /> 
  },
  CRITICAL: { 
    color: 'text-red-400', 
    bgColor: 'bg-red-900/20', 
    icon: <AlertTriangle className="h-4 w-4" /> 
  },
};

const changeTypeConfig: Record<ChangeType, { color: string; label: string }> = {
  ADDED: { color: 'text-green-400', label: 'Added' },
  REMOVED: { color: 'text-red-400', label: 'Removed' },
  MODIFIED: { color: 'text-yellow-400', label: 'Modified' },
  MISMATCH: { color: 'text-orange-400', label: 'Mismatch' },
};

export function DriftReportModal({ isOpen, onClose, driftReport, onReconcile, isReconciling }: DriftReportModalProps) {
  if (!driftReport) return null;

  const severityInfo = severityConfig[driftReport.severity];
  const hasDrift = driftReport.has_drift;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Drift Detection Report" size="lg">
      <div className="space-y-4">
        {/* Summary Section */}
        <div className={cn('p-4 rounded-lg border', severityInfo.bgColor, 'border-slate-700')}>
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5', severityInfo.color)}>
              {severityInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-white">
                  {hasDrift ? 'Drift Detected' : 'No Drift Detected'}
                </h3>
                <Badge className={cn('text-xs', severityInfo.color, severityInfo.bgColor)}>
                  {driftReport.severity}
                </Badge>
              </div>
              <p className="text-sm text-slate-300">{driftReport.summary}</p>
              <div className="mt-2 text-xs text-slate-400">
                Detected: {new Date(driftReport.detected_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Resource Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <div>
            <div className="text-xs text-slate-400 mb-1">Resource</div>
            <div className="text-sm text-white font-medium">{driftReport.resource_name}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Kind</div>
            <div className="text-sm text-white font-medium">{driftReport.resource_kind}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Namespace</div>
            <div className="text-sm text-white font-medium">{driftReport.resource_namespace}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Changes</div>
            <div className="text-sm text-white font-medium">{driftReport.changes.length}</div>
          </div>
        </div>

        {/* Changes Table */}
        {hasDrift && driftReport.changes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Detected Changes</h4>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/50">
                    <tr className="border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Field</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Desired</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Observed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {driftReport.changes.map((change, index) => {
                      const changeInfo = changeTypeConfig[change.changeType];
                      const changeSeverity = severityConfig[change.severity];
                      
                      return (
                        <tr key={index} className="hover:bg-slate-900/30">
                          <td className="px-4 py-3 text-white font-mono text-xs">
                            {change.field}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('text-xs', changeInfo.color)}>
                              {changeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 font-mono text-xs max-w-xs truncate">
                            {formatValue(change.desired)}
                          </td>
                          <td className="px-4 py-3 text-slate-300 font-mono text-xs max-w-xs truncate">
                            {formatValue(change.observed)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={cn('w-1.5 h-1.5 rounded-full', changeSeverity.color.replace('text-', 'bg-'))} />
                              <span className="text-xs text-slate-400">{change.impact}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {hasDrift && onReconcile && (
            <Button 
              variant="primary" 
              onClick={onReconcile} 
              disabled={isReconciling}
              className="flex items-center gap-2"
            >
              {isReconciling ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Reconciling...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reconcile Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
