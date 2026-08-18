import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BetBar from "./BetBar";
import { crashCashout, crashStart, errorText, fmt } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

/** Multiplier curve — must match the server-side validation (1.07^seconds). */
const curve = (seconds: number) => Math.pow(1.07, seconds);
const secondsFor = (mult: number) => Math.log(mult) / Math.log(1.07);

type Phase = "betting" | "flying" | "crashed";

const BETTING_MS = 6000;
const CRASHED_MS = 3500;

/** Client-side visual bust point; the server always has the final word on payouts. */
const randomBust = () => Math.min(25, Math.max(1.05, 0.96 / (1 - Math.random())));

const chipTone = (m: number) =>
  m >= 10 ? "text-fuchsia-400 border-fuchsia-400/40" : m >= 2 ? "text-emerald-400 border-emerald-400/40" : "text-sky-400 border-sky-400/40";

const NAMES = ["Ali", "Mo", "Sara", "Kirill", "Nour", "Deniz", "Yuki", "Omar", "Lena", "Rafa"];

const AviatorGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);

  const [stake, setStake] = useState("0.5");
  const [phase, setPhase] = useState<Phase>("betting");
  const [countdown, setCountdown] = useState(BETTING_MS);
  const [queued, setQueued] = useState<number | null>(null);
  const [betId, setBetId] = useState<string | null>(null);
  const [mult, setMult] = useState(1);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([2.31, 1.14, 5.72, 1.02, 3.4]);
  const [busy, setBusy] = useState(false);
  const [players, setPlayers] = useState<{ name: string; bet: number; out?: number }[]>([]);

  const startedAt = useRef(0);
  const bust = useRef(2);
  const probed = useRef(false);
  const raf = useRef<number>();
  const cashedRef = useRef(false);

  const rollPlayers = () =>
    setPlayers(
      Array.from({ length: 5 }, (_, i) => ({
        name: NAMES[Math.floor(Math.random() * NAMES.length)] + (i % 2 ? "•" : ""),
        bet: Number((Math.random() * 4 + 0.2).toFixed(2)),
      })),
    );

  /** Resolve the round: ask the server where it actually crashed. */
  const probe = useCallback(
    async (id: string) => {
      const res: any = await crashCashout(user.telegramUser.id, id, 1e6);
      const serverCrash = Number(res?.crash || 0);
      setBetId(null);
      await refreshProfile();
      return serverCrash > 1 ? serverCrash : bust.current;
    },
    [refreshProfile, user.telegramUser.id],
  );

  const endRound = useCallback(
    (at: number) => {
      setPhase("crashed");
      setCrashAt(at);
      setMult(at);
      setHistory((h) => [Number(at.toFixed(2)), ...h].slice(0, 10));
      setPlayers((ps) => ps.map((p) => (Math.random() > 0.55 ? { ...p, out: Number((1 + Math.random() * (at - 1)).toFixed(2)) } : p)));
      if (!cashedRef.current && queued) setResult(`Flew away at ×${at.toFixed(2)} — lost ${fmt(queued)} Gram`);
      setQueued(null);
    },
    [queued],
  );

  /* Flight animation + resolution */
  useEffect(() => {
    if (phase !== "flying") return;
    let cancelled = false;
    const tick = async () => {
      const m = curve((Date.now() - startedAt.current) / 1000);
      setMult(m);
      if (m >= bust.current && !probed.current) {
        probed.current = true;
        if (betId && !cashedRef.current) {
          const real = await probe(betId);
          if (cancelled) return;
          bust.current = Math.max(real, m);
          if (m >= bust.current) return endRound(bust.current);
        } else {
          return endRound(bust.current);
        }
      }
      if (probed.current && m >= bust.current) return endRound(bust.current);
      raf.current = requestAnimationFrame(() => void tick());
    };
    raf.current = requestAnimationFrame(() => void tick());
    return () => {
      cancelled = true;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [phase, betId, probe, endRound]);

  /* Round scheduler */
  useEffect(() => {
    if (phase === "betting") {
      rollPlayers();
      const started = Date.now();
      const id = setInterval(() => {
        const left = BETTING_MS - (Date.now() - started);
        setCountdown(Math.max(0, left));
        if (left <= 0) {
          clearInterval(id);
          void takeOff();
        }
      }, 100);
      return () => clearInterval(id);
    }
    if (phase === "crashed") {
      const id = setTimeout(() => {
        setPhase("betting");
        setMult(1);
        setCrashAt(null);
      }, CRASHED_MS);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const takeOff = async () => {
    bust.current = randomBust();
    probed.current = false;
    cashedRef.current = false;
    startedAt.current = Date.now();
    setMult(1);
    if (queued) {
      const res: any = await crashStart(user.telegramUser.id, queued);
      if (!res?.success) {
        toast({ title: "Bet failed", description: errorText(res?.error), variant: "destructive" });
        setQueued(null);
      } else {
        setBetId(res.bet_id as string);
        startedAt.current = Date.now();
        await refreshProfile();
      }
    }
    setPhase("flying");
  };

  const placeBet = () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (amount > balance) {
      toast({ title: "Bet failed", description: errorText("insufficient_funds"), variant: "destructive" });
      return;
    }
    setResult(null);
    setQueued(amount);
  };

  const cashout = async () => {
    if (!betId) return;
    setBusy(true);
    cashedRef.current = true;
    const at = Number(curve((Date.now() - startedAt.current) / 1000).toFixed(2));
    const res: any = await crashCashout(user.telegramUser.id, betId, at);
    setBetId(null);
    if (Number(res?.payout) > 0) {
      setResult(`Cashed out ×${res.multiplier} · +${fmt(res.payout)} Gram`);
      setQueued(null);
    } else {
      cashedRef.current = false;
      bust.current = Number(res?.crash || at);
      probed.current = true;
    }
    await refreshProfile();
    setBusy(false);
  };

  const progress = Math.min(1, secondsFor(mult) / secondsFor(12));
  const px = 6 + 80 * progress;
  const py = 10 + 66 * progress;
  const flying = phase === "flying";

  return (
    <div className="space-y-4">
      {/* Recent rounds */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {history.map((h, i) => (
          <span key={`${h}-${i}`} className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${chipTone(h)}`}>
            ×{h.toFixed(2)}
          </span>
        ))}
      </div>

      {/* Sky */}
      <div className="relative h-[290px] overflow-hidden rounded-3xl border border-white/12 bg-[radial-gradient(120%_90%_at_20%_110%,hsl(var(--primary)/0.35),transparent_60%),linear-gradient(180deg,#150c25,#05030c)]">
        <motion.div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.6) 0deg 0.6deg, transparent 0.6deg 30deg)",
          }}
          animate={{ rotate: flying ? 360 : 0 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="av-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M6,90 Q${6 + (px - 6) * 0.62},${90 - (90 - (100 - py)) * 0.12} ${px},${100 - py} L${px},90 Z`}
            fill="url(#av-fill)"
          />
          <path
            d={`M6,90 Q${6 + (px - 6) * 0.62},${90 - (90 - (100 - py)) * 0.12} ${px},${100 - py}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        <motion.div
          className="absolute h-9 w-9"
          style={{ left: `${px}%`, bottom: `${py}%` }}
          animate={
            phase === "crashed"
              ? { x: 220, y: -140, opacity: 0, rotate: 25 }
              : { x: 0, y: flying ? [0, -4, 0] : 0, opacity: 1, rotate: -12 }
          }
          transition={phase === "crashed" ? { duration: 0.9, ease: "easeIn" } : { duration: 1.6, repeat: Infinity }}
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9 drop-shadow-[0_0_10px_hsl(var(--primary)/0.7)]" fill="hsl(var(--primary))">
            <path d="M2.5 13.5 21 12 2.5 10.5l1.8 1.5-1.8 1.5Zm6-3.2L6 4.5l2.4.2 3.6 5.1-3.5.5Zm0 3.4 3.5.5-3.6 5.1-2.4.2 2.5-5.8Z" />
          </svg>
        </motion.div>

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
          <AnimatePresence mode="wait">
            {phase === "betting" ? (
              <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Next round in</p>
                <p className="font-display text-5xl text-foreground">{(countdown / 1000).toFixed(1)}s</p>
                <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-100"
                    style={{ width: `${(countdown / BETTING_MS) * 100}%` }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="mult"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-display text-6xl ${phase === "crashed" ? "text-destructive" : "text-foreground"}`}
              >
                ×{(crashAt ?? mult).toFixed(2)}
              </motion.p>
            )}
          </AnimatePresence>
          {phase === "crashed" && (
            <p className="mt-1 text-[12px] uppercase tracking-[0.3em] text-destructive">Flew away</p>
          )}
        </div>

        {queued !== null && (
          <span className="absolute left-4 top-4 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] text-foreground">
            Bet {fmt(queued)} Gram
          </span>
        )}
      </div>

      {result && <p className="text-center text-[12px] text-muted-foreground">{result}</p>}

      {/* Bet controls */}
      {flying && betId ? (
        <button
          type="button"
          onClick={() => void cashout()}
          disabled={busy}
          className="btn-ink h-14 w-full text-[13px] font-semibold uppercase tracking-widest disabled:opacity-50"
        >
          Cash out ×{mult.toFixed(2)} · {fmt((queued ?? 0) * mult)} Gram
        </button>
      ) : (
        <BetBar
          stake={stake}
          onStake={setStake}
          balance={balance}
          busy={busy}
          label={queued !== null ? "Waiting" : phase === "betting" ? "Bet" : "Next round"}
          onPlay={placeBet}
          disabled={queued !== null || phase !== "betting"}
        />
      )}

      {/* Live players */}
      <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-4">
        <p className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">Live bets</p>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div key={`${p.name}-${i}`} className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">{p.name}</span>
              <span className="text-foreground">{fmt(p.bet)} Gram</span>
              <span className={p.out ? "text-emerald-400" : "text-muted-foreground"}>{p.out ? `×${p.out}` : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AviatorGame;
