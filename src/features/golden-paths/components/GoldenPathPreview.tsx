import { Check, CheckCircle2, Copy, FileCode, Play, Terminal } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import { ApplyStatusAlert } from './ApplyStatusAlert';
import type { ApplyStatus } from '../types';

interface GoldenPathPreviewProps {
  yaml: string;
  copied: boolean;
  applying: boolean;
  status: ApplyStatus;
  onCopy: () => void;
  onApply: () => void;
}

export function GoldenPathPreview({
  yaml,
  copied,
  applying,
  status,
  onCopy,
  onApply,
}: GoldenPathPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Generated Manifest</span>
          {yaml ? (
            <Button variant="ghost" size="sm" onClick={onCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden />
                  Copy
                </>
              )}
            </Button>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {yaml ? (
          <div className="space-y-4">
            <ApplyStatusAlert status={status} />

            <pre className="bg-slate-900 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto max-h-[400px] overflow-y-auto">
              <code>{yaml}</code>
            </pre>

            <div className="flex gap-3">
              <Button
                onClick={onApply}
                disabled={applying || status.type === 'success'}
                loading={applying}
                className="flex-1"
              >
                {status.type === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Applied
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden />
                    Apply to Platform
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <Terminal className="h-4 w-4" aria-hidden />
                Or use CLI:{' '}
                <code className="text-blue-400">zaractl apply -f manifest.yaml</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden />
            <p>Fill in the configuration and click Generate</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
