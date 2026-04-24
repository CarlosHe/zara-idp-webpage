import { useCallback, useMemo, useState } from 'react';
import { useApplyYamlMutation } from '@/features/resources/services/resourcesApi';
import { errorMessage } from '@/shared/lib/api';
import type { ApplyStatus, GoldenPath } from '../types';

interface UseGoldenPathBuilderResult {
  selectedPath: GoldenPath | null;
  formValues: Record<string, string>;
  generatedYaml: string;
  copied: boolean;
  applying: boolean;
  applyStatus: ApplyStatus;
  isFormValid: boolean;
  selectPath: (path: GoldenPath) => void;
  clearPath: () => void;
  setFormValue: (name: string, value: string) => void;
  generate: () => void;
  copy: () => Promise<void>;
  apply: () => Promise<void>;
}

const COPY_FEEDBACK_MS = 2000;

export function useGoldenPathBuilder(): UseGoldenPathBuilderResult {
  const [selectedPath, setSelectedPath] = useState<GoldenPath | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedYaml, setGeneratedYaml] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>({ type: 'idle' });
  const [applyYaml, applyState] = useApplyYamlMutation();

  const selectPath = useCallback((path: GoldenPath) => {
    setSelectedPath(path);
    const defaults: Record<string, string> = {};
    path.parameters.forEach((param) => {
      if (param.default) defaults[param.name] = param.default;
    });
    setFormValues(defaults);
    setGeneratedYaml('');
    setCopied(false);
    setApplyStatus({ type: 'idle' });
  }, []);

  const clearPath = useCallback(() => {
    setSelectedPath(null);
    setFormValues({});
    setGeneratedYaml('');
    setApplyStatus({ type: 'idle' });
  }, []);

  const setFormValue = useCallback((name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const generate = useCallback(() => {
    if (!selectedPath) return;
    const rendered = Object.entries(formValues).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), value),
      selectedPath.template,
    );
    setGeneratedYaml(rendered);
  }, [selectedPath, formValues]);

  const copy = useCallback(async () => {
    if (!generatedYaml) return;
    await navigator.clipboard.writeText(generatedYaml);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, [generatedYaml]);

  const apply = useCallback(async () => {
    if (!generatedYaml) {
      setApplyStatus({ type: 'error', message: 'Please generate YAML first' });
      return;
    }
    setApplyStatus({ type: 'idle' });

    try {
      const result = await applyYaml({ yaml: generatedYaml }).unwrap();
      const details = result.results.map((r) => ({
        resource: `${r.kind}/${r.namespace}/${r.name}`,
        status: r.action === 'ERROR' ? ('error' as const) : ('success' as const),
        message: r.error || (r.action === 'CREATED' ? 'Created' : 'Updated'),
      }));
      const hasErrors = result.summary.failed > 0;
      setApplyStatus({
        type: hasErrors ? 'error' : 'success',
        message: hasErrors
          ? `Applied ${result.summary.created + result.summary.updated}/${result.summary.total} resources (${result.summary.failed} failed)`
          : `Successfully applied ${result.summary.total} resource(s) (${result.summary.created} created, ${result.summary.updated} updated)`,
        details,
      });
    } catch (err) {
      setApplyStatus({
        type: 'error',
        message:
          errorMessage(err as Parameters<typeof errorMessage>[0]) ||
          'Failed to apply resources',
      });
    }
  }, [applyYaml, generatedYaml]);

  const isFormValid = useMemo(() => {
    if (!selectedPath) return false;
    return selectedPath.parameters.every(
      (param) =>
        !param.required ||
        (formValues[param.name] != null && formValues[param.name].trim() !== ''),
    );
  }, [selectedPath, formValues]);

  return {
    selectedPath,
    formValues,
    generatedYaml,
    copied,
    applying: applyState.isLoading,
    applyStatus,
    isFormValid,
    selectPath,
    clearPath,
    setFormValue,
    generate,
    copy,
    apply,
  };
}
