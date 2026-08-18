import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import BetBar from "./BetBar";
import { crashCashout, crashStart, errorText, fmt } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

/** Multiplier curve must match the server-side validation (1.07^seconds). */
const curve = (seconds: number) => Math.pow(1.07, seconds);

const AviatorGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);

  const [stake, setStake] = useState("0.5");
  const [busy, setBusy] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [mult, setMult] = useState(1);
  const [flewAway, setFlewAway] = useState(false);
  const [message, setMessage] = useState("Place a bet and cash out before the plane flies away");
  const [history, setHistory] = useState<number[]>([]);
  const startedAt = useRef(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (!betId) return;
    const tick = () => {
      setMult(curve((Date.now() - startedAt.current) / 1000));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [betId]);

  const start = async () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    const res: any = await crashStart(user.telegramUser.id, amount);
    if (!res?.success) {
      toast({ title: "Round failed", description: errorText(res?.error), variant: "destructive" });
      setBusy(false);
      return;
    }
    startedAt.current = Date.now();
    setMult(1);
    setFlewAway(false);
    setMessage("Cash out before the plane flies away");
    setBetId(res.bet_id as string);
    await refreshProfile();
    setBusy(false);
  };

  const cashout = async () => {
    if (!betId) return;
    setBusy(true);
    const seconds = (Date.now() - startedAt.current) / 1000;
    const res: any = await crashCashout(user.telegramUser.id, betId, Number(curve(seconds).toFixed(2)));
    setBetId(null);
    if (res?.payout > 0) {
      setMessage(`Cashed out ×${res.multiplier} · +${fmt(res.payout)} Gram`);
      setHistory((h) => [Number(res.multiplier), ...h].slice(0, 8));
    } else {
      setFlewAway(true);
      setMessage(`Flew away at ×${res?.crash ?? "?"}`);
      if (res?.crash) setHistory((h) => [Number(res.crash), ...h].slice(0, 8));
    }
    await refreshProfile();
    setBusy(false);
  };

  const progress = Math.min(1, (mult - 1) / 4);

  return (
    <div className="space-y-5">
      <div className="relative h-64 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-[#1a1030] to-[#070510]">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: "radial-gradient(120% 90% at 20% 110%, rgba(255,90,90,0.28), transparent 60%)",
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={`M0,100 Q${50 * progress + 20},${100 - 70 * progress} ${8 + 84 * progress},${100 - 78 * progress}`}
            fill="none"
            stroke="rgba(255,120,120,0.9)"
            strokeWidth="1.5"
          />
        </svg>

        <motion.div
          className="absolute text-3xl"
          animate={
            flewAway
              ? { left: "110%", bottom: "90%", opacity: 0 }
              : { left: `${6 + 78 * progress}%`, bottom: `${8 + 70 * progress}%`, opacity: 1 }
          }
          transition={{ duration: flewAway ? 0.6 : 0.15, ease: "linear" }}
        >
          ✈️
        </motion.div>

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
          <p className={`font-display text-6xl ${flewAway ? "text-red-400" : "text-foreground"}`}>
            ×{mult.toFixed(2)}
          </p>
        </div>
        <p className="absolute inset-x-0 bottom-4 px-4 text-center text-[12px] text-muted-foreground">{message}</p>
      </div>

      {history.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {history.map((h, i) => (
            <span
              key={`${h}-${i}`}
              className={`rounded-full border border-white/10 px-3 py-1 text-[11px] ${
                h >= 2 ? "text-emerald-400" : "text-muted-foreground"
              }`}
            >
              ×{h}
            </span>
          ))}
        </div>
      )}

      {betId ? (
        <button
          type="button"
          onClick={() => void cashout()}
          disabled={busy}
          className="btn-ink h-14 w-full text-[13px] font-semibold uppercase tracking-widest"
        >
          Cash out ×{mult.toFixed(2)}
        </button>
      ) : (
        <BetBar
          stake={stake}
          onStake={setStake}
          balance={balance}
          busy={busy}
          label="Bet"
          onPlay={() => void start()}
        />
      )}
    </div>
  );
};

export default AviatorGame;
