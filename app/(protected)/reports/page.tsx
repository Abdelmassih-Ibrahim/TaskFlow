import { getWorkspaceData } from '@/lib/workspace/data';
import { ReportsContent } from '@/components/reports-content';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const workspace = await getWorkspaceData();

  return <ReportsContent {...workspace} />;
}
