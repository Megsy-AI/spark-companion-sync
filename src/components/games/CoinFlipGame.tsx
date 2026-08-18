import { useState } from "react";
import { motion } from "framer-motion";
import BetBar from "./BetBar";
import { errorText, fmt, playRound } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const CoinFlipGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);
  const [stake, setStake] = useState("0.5");
  const [side, setSide] = useState<"heads" | "tails">("heads");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ side: string; payout: number } | null>(null);
  const [flipKey, setFlipKey] = useState(0);

  const play = async () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    setFlipKey((k) => k + 1);
    const res = await playRound(user.telegramUser.id, "coinflip", amount, { side });
    if (!res.success) {
      toast({ title: "Flip failed", description: errorText(res.error), variant: "destructive" });
      setBusy(false);
      return;
    }
    setTimeout(async () => {
      setResult({ side: String((res.outcome as any)?.side ?? "heads"), payout: Number(res.payout || 0) });
      await refreshProfile();
      setBusy(false);
    }, 600);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-8 text-center">
        <motion.div
          key={flipKey}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 720 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-white/25 to-white/5 text-3xl"
        >
          {result?.side === "tails" ? "🪙" : "👑"}
        </motion.div>
        <p className="mt-4 text-[13px] text-muted-foreground">
          {result
            ? result.payout > 0
              ? `${result.side} — you won +${fmt(result.payout)} Gram`
              : `${result.side} — you lost`
            : "Pick a side · pays ×1.96"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["heads", "tails"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`rounded-2xl border py-3 text-[13px] capitalize transition ${
                side === s ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-white/[0.04] text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <BetBar stake={stake} onStake={setStake} balance={balance} busy={busy} label="Flip" onPlay={() => void play()} />
    </div>
  );
};

export default CoinFlipGame;
