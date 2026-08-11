export function MasteryDots({ level, status }: { level: number; status: string }) {
  return <div className="flex items-center gap-1" aria-label={`${status}, review level ${level} of 5`}>{Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-2 w-2 rounded-full ${index < level ? status === "mastered" ? "bg-emerald-500" : "bg-coral" : "bg-slate-200 dark:bg-white/15"}`}/>)}</div>;
}
