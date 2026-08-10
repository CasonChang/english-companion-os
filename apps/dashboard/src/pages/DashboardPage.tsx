import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";

export function DashboardPage() {
  return (
    <><PageHeader eyebrow="Today" title="Welcome back" description="A calm overview of your English practice and what deserves attention next."/><EmptyState title="Your real session is safely stored" description="Home stats, your current focus, and the latest conversation will appear here in the next step."/></>
  );
}
