import { Button } from '@/shared/components/ui';
import type { GoldenPath, ApplyStatus } from '../types';
import { GoldenPathForm } from './GoldenPathForm';
import { GoldenPathPreview } from './GoldenPathPreview';

interface GoldenPathBuilderProps {
  path: GoldenPath;
  formValues: Record<string, string>;
  generatedYaml: string;
  copied: boolean;
  applying: boolean;
  applyStatus: ApplyStatus;
  isFormValid: boolean;
  onBack: () => void;
  onChange: (name: string, value: string) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onApply: () => void;
}

export function GoldenPathBuilder({
  path,
  formValues,
  generatedYaml,
  copied,
  applying,
  applyStatus,
  isFormValid,
  onBack,
  onChange,
  onGenerate,
  onCopy,
  onApply,
}: GoldenPathBuilderProps) {
  const Icon = path.icon;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icon className="h-6 w-6 text-blue-400" aria-hidden />
            {path.name}
          </h1>
          <p className="text-slate-400 mt-1">{path.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoldenPathForm
          path={path}
          values={formValues}
          canGenerate={isFormValid}
          onChange={onChange}
          onGenerate={onGenerate}
        />
        <GoldenPathPreview
          yaml={generatedYaml}
          copied={copied}
          applying={applying}
          status={applyStatus}
          onCopy={onCopy}
          onApply={onApply}
        />
      </div>
    </div>
  );
}
