import { useState } from "react";
import { motion } from "framer-motion";
import BetBar from "./BetBar";
import { errorText, fmt, playRound } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const SEGMENTS = [0, 1.2, 1.8, 3, 8, 25];

const WheelGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);
  const [stake, setStake] = useState("0.5");
  const [busy, setBusy] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [mult, setMult] = useState<number | null>(null);
  const [payout, setPayout] = useState(0);

  const play = async () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    setSpinKey((k) => k + 1);
    const res = await playRound(user.telegramUser.id, "wheel", amount);
    if (!res.success) {
      toast({ title: "Spin failed", description: errorText(res.error), variant: "destructive" });
      setBusy(false);
      return;
    }
    setTimeout(async () => {
      setMult(Number(res.multiplier || 0));
      setPayout(Number(res.payout || 0));
      await refreshProfile();
      setBusy(false);
    }, 900);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-8 text-center">
        <motion.div
          key={spinKey}
          initial={{ rotate: 0 }}
          animate={{ rotate: 1440 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/15 bg-[conic-gradient(from_0deg,rgba(255,255,255,0.22),transparent_25%,rgba(255,255,255,0.22)_50%,transparent_75%,rgba(255,255,255,0.22))]"
        >
          <span className="font-display text-2xl text-foreground">{mult === null ? "?" : `×${mult}`}</span>
        </motion.div>
        <p className="mt-4 text-[13px] text-muted-foreground">
          {mult === null ? "Spin for up to ×25" : payout > 0 ? `+${fmt(payout)} Gram` : "No win this time"}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SEGMENTS.map((s) => (
            <span key={s} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-muted-foreground">
              ×{s}
            </span>
          ))}
        </div>
      </div>

      <BetBar stake={stake} onStake={setStake} balance={balance} busy={busy} label="Spin" onPlay={() => void play()} />
    </div>
  );
};

export default WheelGame;
