import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceFilterBar } from '../components/ResourceFilterBar';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import type { Namespace } from '@/shared/types';

const namespaces: Namespace[] = [
  { name: 'platform', status: 'Active' } as unknown as Namespace,
  { name: 'billing', status: 'Active' } as unknown as Namespace,
];

describe('<ResourceFilterBar />', () => {
  it('lists kinds + namespaces and fires onClearFilters', async () => {
    const onKindChange = vi.fn();
    const onNamespaceChange = vi.fn();
    const onClearFilters = vi.fn();

    const { user } = renderWithProviders(
      <ResourceFilterBar
        kindFilter={null}
        namespaceFilter={null}
        namespaces={namespaces}
        onKindChange={onKindChange}
        onNamespaceChange={onNamespaceChange}
        onClearFilters={onClearFilters}
      />,
    );

    expect(screen.getByLabelText('Resource Kind')).toBeInTheDocument();
    expect(screen.getByLabelText('Namespace')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'platform' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'billing' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it('invokes onNamespaceChange when the user picks a namespace', async () => {
    const onNamespaceChange = vi.fn();
    await userEvent.setup();
    renderWithProviders(
      <ResourceFilterBar
        kindFilter={null}
        namespaceFilter={null}
        namespaces={namespaces}
        onKindChange={vi.fn()}
        onNamespaceChange={onNamespaceChange}
        onClearFilters={vi.fn()}
      />,
    );
    await userEvent.setup().selectOptions(screen.getByLabelText('Namespace'), 'platform');
    expect(onNamespaceChange).toHaveBeenCalled();
  });
});
