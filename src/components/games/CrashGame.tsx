import { useEffect, useRef, useState } from "react";
import BetBar from "./BetBar";
import { crashCashout, crashStart, errorText, fmt } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

/** Multiplier curve must match the server-side validation (1.07^seconds). */
const curve = (seconds: number) => Math.pow(1.07, seconds);

const CrashGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);

  const [stake, setStake] = useState("0.5");
  const [busy, setBusy] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [mult, setMult] = useState(1);
  const [message, setMessage] = useState("Cash out before it crashes");
  const startedAt = useRef(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (!betId) return;
    const tick = () => {
      const seconds = (Date.now() - startedAt.current) / 1000;
      setMult(curve(seconds));
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
    setMessage("Cash out before it crashes");
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
    } else {
      setMessage(`Crashed at ×${res?.crash ?? "?"} — better luck next round`);
    }
    await refreshProfile();
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.05] p-10 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 120%, rgba(255,255,255,0.18), transparent 60%)",
          }}
        />
        <p className="relative font-display text-6xl text-foreground">×{mult.toFixed(2)}</p>
        <p className="relative mt-3 text-[13px] text-muted-foreground">{message}</p>
      </div>

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
        <BetBar stake={stake} onStake={setStake} balance={balance} busy={busy} label="Start" onPlay={() => void start()} />
      )}
    </div>
  );
};

export default CrashGame;
