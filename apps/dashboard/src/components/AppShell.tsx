import { useState, type ComponentType, type SVGProps } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type NavItem = { label: string; to: string; icon: Icon; end?: boolean };

function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}

const HomeIcon: Icon = (props) => <IconBase {...props}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></IconBase>;
const SessionsIcon: Icon = (props) => <IconBase {...props}><path d="M6 4h12a2 2 0 0 1 2 2v12H8a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2Z"/><path d="M8 18a4 4 0 0 0 0-8h12M9 7h7"/></IconBase>;
const ItemsIcon: Icon = (props) => <IconBase {...props}><path d="m12 3 2.2 4.7L19 10l-4.8 2.3L12 17l-2.2-4.7L5 10l4.8-2.3L12 3Z"/><path d="m19 16 .8 1.7L22 19l-2.2 1.3L19 22l-.8-1.7L16 19l2.2-1.3L19 16Z"/></IconBase>;
const MistakesIcon: Icon = (props) => <IconBase {...props}><path d="M12 4 3.5 19h17L12 4Z"/><path d="M12 9v4M12 16h.01"/></IconBase>;
const ProgressIcon: Icon = (props) => <IconBase {...props}><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/></IconBase>;
const ReviewIcon: Icon = (props) => <IconBase {...props}><path d="M12 3a9 9 0 1 0 8.5 6"/><path d="M20 3v6h-6M9 12l2 2 4-5"/></IconBase>;
const WeeklyIcon: Icon = (props) => <IconBase {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h7"/></IconBase>;
const MoreIcon: Icon = (props) => <IconBase {...props}><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></IconBase>;

const desktopNav: NavItem[] = [
  { label: "Home", to: "/", icon: HomeIcon, end: true },
  { label: "Sessions", to: "/sessions", icon: SessionsIcon },
  { label: "Items", to: "/items", icon: ItemsIcon },
  { label: "Mistakes", to: "/mistakes", icon: MistakesIcon },
  { label: "Progress", to: "/progress", icon: ProgressIcon },
  { label: "Review", to: "/review", icon: ReviewIcon },
  { label: "Weekly", to: "/weekly", icon: WeeklyIcon }
];

const mobileNav: NavItem[] = [
  { label: "Home", to: "/", icon: HomeIcon, end: true },
  { label: "Sessions", to: "/sessions", icon: SessionsIcon },
  { label: "Items", to: "/items", icon: ItemsIcon },
  { label: "Review", to: "/review", icon: ReviewIcon },
  { label: "More", to: "/more", icon: MoreIcon }
];

function DesktopLink({ item }: { item: NavItem }) {
  return <NavLink to={item.to} end={item.end} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-mint text-ink" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><item.icon className="h-5 w-5"/><span>{item.label}</span></NavLink>;
}

function MobileLink({ item }: { item: NavItem }) {
  return <NavLink to={item.to} end={item.end} className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[0.65rem] font-semibold transition ${isActive ? "text-emerald-700 dark:text-mint" : "text-slate-400 dark:text-slate-500"}`}><item.icon className="h-5 w-5"/><span>{item.label}</span></NavLink>;
}

export function AppShell() {
  const { session, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    setSignOutError("");
    try { await signOut(); } catch { setSignOutError("Couldn’t sign out. Try again."); }
  }

  return (
    <div className="min-h-screen bg-mist text-ink dark:bg-[#07101c] dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink px-4 py-6 text-white md:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-lg text-ink">✦</span>
          <div><p className="font-semibold leading-tight">English</p><p className="text-sm text-slate-400">Companion</p></div>
        </div>
        <nav className="mt-10 space-y-1" aria-label="Primary navigation">{desktopNav.map((item) => <DesktopLink key={item.to} item={item}/>)}</nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="truncate px-2 text-xs text-slate-500">{session?.user.email}</p>
          <button onClick={handleSignOut} className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">Sign out</button>
          {signOutError && <p className="mt-2 px-2 text-xs text-red-300" role="alert">{signOutError}</p>}
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-mist/90 px-5 backdrop-blur md:hidden dark:border-white/10 dark:bg-[#07101c]/90">
          <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-mint dark:bg-mint dark:text-ink">✦</span><span className="font-semibold">English Companion</span></div>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-label="Signed in"/>
        </header>
        <main className="mx-auto min-h-screen max-w-7xl px-4 pb-28 pt-7 sm:px-6 md:px-8 md:pb-12 md:pt-10"><Outlet/></main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden dark:border-white/10 dark:bg-[#0b1625]/95" aria-label="Mobile navigation">{mobileNav.map((item) => <MobileLink key={item.to} item={item}/>)}</nav>
    </div>
  );
}
