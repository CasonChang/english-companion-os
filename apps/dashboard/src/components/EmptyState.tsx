import type { ReactNode } from "react";

export function EmptyState({ icon = "✦", title, description, action }: { icon?: string; title: string; description: string; action?: ReactNode }) {
  return <section className="mt-8 grid min-h-64 place-items-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-white/15 dark:bg-white/[0.03]"><div className="max-w-md"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-mint/60 text-xl text-ink dark:bg-mint">{icon}</span><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>{action && <div className="mt-5">{action}</div>}</div></section>;
}
