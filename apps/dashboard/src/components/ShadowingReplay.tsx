import { useEffect, useState } from "react";

export function ShadowingReplay({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function close() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setOpen(false);
    setIndex(0);
  }

  function listen() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lines[index]);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  if (!open) return <button onClick={() => setOpen(true)} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-mint dark:text-ink">▶ Replay shadowing</button>;

  const finished = index >= lines.length;
  return <div className="rounded-2xl bg-ink p-5 text-white sm:p-7">
    {finished ? <div className="text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-mint text-xl text-ink">✓</span><h3 className="mt-4 text-xl font-semibold">Replay complete</h3><p className="mt-2 text-sm text-slate-400">Nice work—one clear repetition is enough.</p><button onClick={close} className="mt-5 rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-ink">Done</button></div> : <><div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400"><span>Read aloud</span><span>{index + 1} / {lines.length}</span></div><p className="my-8 text-center text-2xl font-semibold leading-relaxed sm:text-3xl">{lines[index]}</p><div className="grid gap-2 sm:grid-cols-3"><button onClick={listen} disabled={speaking} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{speaking ? "Playing…" : "🔊 Listen first"}</button><button onClick={close} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold">Close</button><button onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); setIndex((value) => value + 1); }} className="rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-ink">I said it →</button></div></>}
  </div>;
}
