import { getWorkspaceData } from '@/lib/workspace/data';
import { CalendarContent } from '@/components/calendar-content';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const workspace = await getWorkspaceData();

  return <CalendarContent {...workspace} />;
}
