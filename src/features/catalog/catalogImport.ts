import type { CatalogRegistration } from './types';

export function catalogValuesEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && catalogValuesEqual(a[key], b[key]));
}

const kinds = new Set(['Application', 'Service', 'API', 'System', 'Domain', 'Group', 'User', 'Resource', 'DocSet', 'Environment', 'Location']);

export function parseCatalogImport(text: string): CatalogRegistration[] {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data) || !data.length || data.length > 5000) throw new Error('Provide a JSON array of 1 to 5000 catalog registrations.');
  const seen = new Set<string>();
  for (const [index, value] of data.entries()) {
    const e = value as Partial<CatalogRegistration> | null;
    if (!e || !kinds.has(e.kind ?? '') || typeof e.name !== 'string' || typeof e.namespace !== 'string'
      || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(e.name) || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(e.namespace)
      || !e.spec || typeof e.spec !== 'object' || Array.isArray(e.spec)) throw new Error(`Invalid catalog registration at row ${index + 1}.`);
    if (e.relationships !== undefined && (!Array.isArray(e.relationships) || e.relationships.some((r) =>
      !r || !r.type || !r.targetKind || !r.targetName || !r.namespace))) throw new Error(`Invalid relationships at row ${index + 1}.`);
    const key = `${e.kind}/${e.namespace}/${e.name}`;
    if (seen.has(key)) throw new Error(`Duplicate catalog identity: ${key}`);
    seen.add(key);
  }
  return data as CatalogRegistration[];
}

