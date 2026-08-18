import { useState } from "react";
import { motion } from "framer-motion";
import BetBar from "./BetBar";
import { errorText, fmt, playRound } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = ["🍒", "🍋", "🍇", "🔔", "⭐", "💎", "7️⃣", "👑"];

const SlotsGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);
  const [stake, setStake] = useState("0.5");
  const [busy, setBusy] = useState(false);
  const [reels, setReels] = useState<number[]>([0, 3, 6]);
  const [spinKey, setSpinKey] = useState(0);
  const [last, setLast] = useState<{ mult: number; payout: number } | null>(null);

  const spin = async () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    setSpinKey((k) => k + 1);
    const res = await playRound(user.telegramUser.id, "slots", amount);
    if (!res.success) {
      toast({ title: "Spin failed", description: errorText(res.error), variant: "destructive" });
      setBusy(false);
      return;
    }
    setTimeout(async () => {
      setReels((res.outcome as any)?.reels ?? [0, 1, 2]);
      setLast({ mult: Number(res.multiplier || 0), payout: Number(res.payout || 0) });
      await refreshProfile();
      setBusy(false);
    }, 700);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-6">
        <div className="grid grid-cols-3 gap-3">
          {reels.map((s, i) => (
            <motion.div
              key={`${spinKey}-${i}`}
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: i * 0.12 }}
              className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-4xl"
            >
              {SYMBOLS[s] ?? "🍒"}
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          {last
            ? last.payout > 0
              ? `Win ×${last.mult} · +${fmt(last.payout)} Gram`
              : "No win — spin again"
            : "Three of a kind pays up to ×100"}
        </p>
      </div>

      <BetBar stake={stake} onStake={setStake} balance={balance} busy={busy} label="Spin" onPlay={() => void spin()} />
    </div>
  );
};

export default SlotsGame;
