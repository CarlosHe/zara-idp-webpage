import { useGoldenPathBuilder } from '../hooks/useGoldenPathBuilder';
import { GoldenPathBuilder } from './GoldenPathBuilder';
import { GoldenPathCatalog } from './GoldenPathCatalog';

export function GoldenPathsPage() {
  const builder = useGoldenPathBuilder();

  if (!builder.selectedPath) {
    return <GoldenPathCatalog onSelect={builder.selectPath} />;
  }

  return (
    <GoldenPathBuilder
      path={builder.selectedPath}
      formValues={builder.formValues}
      generatedYaml={builder.generatedYaml}
      copied={builder.copied}
      applying={builder.applying}
      applyStatus={builder.applyStatus}
      isFormValid={builder.isFormValid}
      onBack={builder.clearPath}
      onChange={builder.setFormValue}
      onGenerate={builder.generate}
      onCopy={builder.copy}
      onApply={builder.apply}
    />
  );
}
