import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardClientWrapper } from './DashboardClientWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  // Ensure plain object serialization for React Server Component props
  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <DashboardClientWrapper user={plainUser}>
      {children}
    </DashboardClientWrapper>
  );
}
