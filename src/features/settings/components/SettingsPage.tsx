import { Settings } from 'lucide-react';
import { useGetMeQuery } from '@/features/auth/services/authApi';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { PageHeader } from '@/shared/components/feedback';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { AUTH_TOKEN_KEY } from '@/shared/lib/api';

export function SettingsPage() {
  const { data: principal } = useGetMeQuery();
  return <div className="space-y-6">
    <PageHeader icon={<Settings />} title="Account settings" description="Your authenticated identity, workspace access and appearance." />
    <Card><CardHeader><CardTitle>Current session</CardTitle></CardHeader><CardContent className="space-y-3">
      <p>Subject: {principal?.subject}</p><p>Email: {principal?.email || 'Not provided'}</p>
      <p>Roles: {principal?.roles.join(', ') || 'None'}</p><p>Namespaces: {principal?.namespaces.join(', ') || 'None'}</p>
      {principal?.tokenExpiry && <p>Expires: {new Date(principal.tokenExpiry).toLocaleString()}</p>}
      <Button variant="danger" onClick={() => { localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem('zara.tenant'); window.location.replace('/login'); }}>Sign out</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Appearance</CardTitle></CardHeader><CardContent><ThemeToggle /></CardContent></Card>
  </div>;
}
