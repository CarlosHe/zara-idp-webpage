import { TenantSelector } from '@/features/tenants/components/TenantSelector';
import { useGetMeQuery } from '@/features/auth/services/authApi';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';

export function WorkspaceControls() {
  const { data: principal } = useGetMeQuery();

  return <>
    <TenantSelector />
    <ThemeToggle />
    <span className="text-sm text-slate-300">{principal?.username}</span>
  </>;
}
