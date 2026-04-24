import { FileCode } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@/shared/components/ui';
import type { GoldenPath } from '../types';

interface GoldenPathFormProps {
  path: GoldenPath;
  values: Record<string, string>;
  canGenerate: boolean;
  onChange: (name: string, value: string) => void;
  onGenerate: () => void;
}

export function GoldenPathForm({
  path,
  values,
  canGenerate,
  onChange,
  onGenerate,
}: GoldenPathFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {path.parameters.map((param) => {
          const label = (
            <>
              {param.label}
              {param.required ? <span className="text-red-400 ml-1">*</span> : null}
            </>
          );
          if (param.type === 'select') {
            return (
              <Select
                key={param.name}
                label={label}
                options={param.options ?? []}
                value={values[param.name] ?? ''}
                onChange={(event) => onChange(param.name, event.target.value)}
              />
            );
          }
          return (
            <Input
              key={param.name}
              label={label}
              value={values[param.name] ?? ''}
              onChange={(event) => onChange(param.name, event.target.value)}
              placeholder={param.placeholder}
            />
          );
        })}

        <Button onClick={onGenerate} disabled={!canGenerate} className="w-full mt-4">
          <FileCode className="h-4 w-4" aria-hidden />
          Generate YAML
        </Button>
      </CardContent>
    </Card>
  );
}
