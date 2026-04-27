import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { ChargebackRow } from '../types/cost';
import { formatMoney } from './costFormat';

interface ChargebackProps {
  rows: ChargebackRow[];
}

// Sprint-26 / L-2605 — chargeback table. Sortable on the server
// side; the frontend only renders the deterministic order.
export function Chargeback({ rows }: ChargebackProps) {
  return (
    <Card data-testid="cost-chargeback">
      <CardHeader>
        <CardTitle className="text-sm uppercase text-slate-400">
          Chargeback
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">
            No chargeback rows for the selected window.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400 uppercase text-xs">
              <tr>
                <th className="py-1">Team</th>
                <th>Domain</th>
                <th>Service</th>
                <th>Env</th>
                <th className="text-right">Spend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={`${row.team}-${row.service}-${row.environment}-${idx}`}
                  className="border-t border-slate-800"
                >
                  <td className="py-1.5">{row.team || '—'}</td>
                  <td>{row.domain || '—'}</td>
                  <td>{row.service || '—'}</td>
                  <td>{row.environment || '—'}</td>
                  <td className="text-right font-mono text-emerald-200">
                    {formatMoney(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
