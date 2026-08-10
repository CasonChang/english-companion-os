import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";

const copy = {
  sessions: ["Sessions", "Your conversations, summaries, corrections, and shadowing in one place.", "Your first session is ready to appear here."],
  items: ["Learning items", "Useful words and expressions collected from your real conversations.", "New expressions will collect here as you practice."],
  mistakes: ["Mistakes", "See recurring patterns and the real sentences behind them.", "Patterns become useful once there are a few sessions to compare."],
  progress: ["Progress", "A focused view of practice, retention, and improvement over time.", "Your progress charts need a little more history."],
  review: ["Daily review", "A short self-paced mix built from what is due today.", "Nothing is due right now. Enjoy the quiet moment."],
  weekly: ["Weekly", "Look back at weekly reports and choose what to focus on next.", "Your first weekly reflection will arrive after a full week."],
  more: ["More", "Mistakes, progress, weekly reports, and account actions.", "Choose a section from the links below."]
} as const;

export type PlaceholderKind = keyof typeof copy;

export function PlaceholderPage({ kind }: { kind: PlaceholderKind }) {
  const [title, description, empty] = copy[kind];
  return <><PageHeader eyebrow="Your learning" title={title} description={description}/>{kind === "more" ? <div className="mt-7 grid gap-3 sm:grid-cols-3">{[["Mistakes","#/mistakes"],["Progress","#/progress"],["Weekly","#/weekly"]].map(([label,href])=><a key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 font-semibold shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5">{label}<span className="float-right text-slate-400">→</span></a>)}</div> : <EmptyState title={empty} description="This page shell is ready; live Supabase content is the next step."/>}</>;
}
