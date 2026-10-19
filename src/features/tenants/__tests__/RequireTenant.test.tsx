import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import { RequireTenant } from '../components/RequireTenant';

const tenant = { id: 'acme', slug: 'acme', displayName: 'Acme', owner: 'owner@example.com', admins: [], lifecycle: 'active' };
const mounted = vi.fn();
function ScopedFeature() { useEffect(() => { mounted(); }, []); return <p>Tenant content</p>; }
function session(admin = true, email = 'admin@example.com') {
  server.use(http.get('*/api/v1/me', () => HttpResponse.json({ authenticated: true, is_admin: admin, email, username: 'test' })));
}
function list(items: object[]) { server.use(http.get('*/api/v1/tenants', () => HttpResponse.json({ items }))); }

beforeEach(() => { localStorage.removeItem('zara.tenant'); mounted.mockClear(); session(); list([tenant]); });
describe('tenant-scoped routes', () => {
  it('does not mount or fetch the feature without a tenant', async () => {
    renderWithProviders(<RequireTenant><ScopedFeature /></RequireTenant>);
    expect(await screen.findByRole('heading', { name: 'Choose a tenant to continue' })).toBeVisible();
    expect(screen.getByLabelText('Select tenant')).toHaveValue('');
    expect(mounted).not.toHaveBeenCalled();
  });
  it('mounts only with an accessible active tenant', async () => {
    localStorage.setItem('zara.tenant', 'acme');
    renderWithProviders(<RequireTenant><ScopedFeature /></RequireTenant>);
    expect(await screen.findByText('Tenant content')).toBeVisible();
    expect(mounted).toHaveBeenCalledTimes(1);
  });
  it.each(['suspended', 'archived'])('blocks a stored %s tenant and offers recovery', async (lifecycle) => {
    localStorage.setItem('zara.tenant', 'acme'); list([{ ...tenant, lifecycle }]);
    renderWithProviders(<RequireTenant><ScopedFeature /></RequireTenant>);
    expect(await screen.findByRole('heading', { name: 'Tenant unavailable' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Manage tenants' })).toBeVisible();
    expect(mounted).not.toHaveBeenCalled();
  });
  it('does not expose an inaccessible tenant to a non-member', async () => {
    localStorage.setItem('zara.tenant', 'acme'); session(false, 'stranger@example.com');
    renderWithProviders(<RequireTenant><ScopedFeature /></RequireTenant>);
    expect(await screen.findByText(/Ask a tenant owner/)).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Manage tenants' })).not.toBeInTheDocument();
    expect(mounted).not.toHaveBeenCalled();
  });
  it('allows a tenant owner without platform admin privileges', async () => {
    localStorage.setItem('zara.tenant', 'acme'); session(false, tenant.owner);
    renderWithProviders(<RequireTenant><ScopedFeature /></RequireTenant>);
    expect(await screen.findByText('Tenant content')).toBeVisible();
  });
  it('shows tenant discovery errors instead of mounting scoped requests', async () => {
    server.use(http.get('*/api/v1/tenants', () => HttpResponse.json({ message: 'Access denied' }, { status: 403 })));
    renderWithProviders(<RequireTenant><ScopedFeature /></RequireTenant>);
    await waitFor(() => expect(screen.getByRole('button', { name: /Retry/i })).toBeVisible());
    expect(screen.getByText('Access denied')).toBeVisible();
    expect(mounted).not.toHaveBeenCalled();
  });
});
