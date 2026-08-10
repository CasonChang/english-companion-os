export function LoadingSkeleton() {
  return <div className="mt-8 space-y-4" aria-label="Loading content" aria-busy="true"><div className="h-28 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-white/10"/><div className="grid gap-4 sm:grid-cols-2"><div className="h-48 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-white/10"/><div className="h-48 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-white/10"/></div></div>;
}
