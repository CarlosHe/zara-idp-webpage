import { describe, expect, it } from 'vitest';
import { publishToast } from './bus';
import { toastStore } from '@/shared/components/ui/Toast';

describe('publishToast', () => {
  it('pushes a toast with the corresponding kind onto the store', () => {
    publishToast({ level: 'warning', title: 'Watch out', message: 'disk 90%' });
    const list = toastStore.getSnapshot();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ kind: 'warning', title: 'Watch out' });
  });

  it('appends the correlation id to the rendered message', () => {
    publishToast({
      level: 'error',
      title: 'Server error',
      message: 'something broke',
      correlationId: 'abc-123',
    });
    const latest = toastStore.getSnapshot().at(-1);
    expect(String(latest?.message)).toContain('something broke');
    expect(String(latest?.message)).toContain('correlation_id=abc-123');
  });

  it('returns the generated id and allows dismissing that entry', () => {
    const id = publishToast({ level: 'info', title: 'FYI' });
    expect(toastStore.getSnapshot()).toHaveLength(1);
    toastStore.dismiss(id);
    expect(toastStore.getSnapshot()).toHaveLength(0);
  });
});
