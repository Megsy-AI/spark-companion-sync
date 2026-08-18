import { useState } from "react";
import { motion } from "framer-motion";
import BetBar from "./BetBar";
import { errorText, fmt, playRound } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const CHOICES = [
  { key: "red", label: "Red", pay: "×1.94", cls: "bg-red-500/25 border-red-400/40" },
  { key: "green", label: "0", pay: "×14", cls: "bg-emerald-500/25 border-emerald-400/40" },
  { key: "black", label: "Black", pay: "×1.94", cls: "bg-white/10 border-white/25" },
] as const;

const RouletteGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);
  const [stake, setStake] = useState("0.5");
  const [pick, setPick] = useState<"red" | "black" | "green">("red");
  const [busy, setBusy] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [result, setResult] = useState<{ pocket: number; color: string; payout: number } | null>(null);

  const play = async () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    setSpinKey((k) => k + 1);
    const res = await playRound(user.telegramUser.id, "roulette", amount, { color: pick });
    if (!res.success) {
      toast({ title: "Spin failed", description: errorText(res.error), variant: "destructive" });
      setBusy(false);
      return;
    }
    setTimeout(async () => {
      const o = res.outcome as any;
      setResult({ pocket: Number(o?.pocket ?? 0), color: String(o?.color ?? "red"), payout: Number(res.payout || 0) });
      await refreshProfile();
      setBusy(false);
    }, 800);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-8 text-center">
        <motion.div
          key={spinKey}
          initial={{ rotate: 0 }}
          animate={{ rotate: 1080 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/15 bg-gradient-to-br from-white/15 to-transparent"
        >
          <span className="font-display text-3xl text-foreground">{result ? result.pocket : "?"}</span>
        </motion.div>
        <p className="mt-4 text-[13px] text-muted-foreground">
          {result
            ? result.payout > 0
              ? `${result.color} — +${fmt(result.payout)} Gram`
              : `${result.color} — no win`
            : "Pick a colour and spin"}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {CHOICES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setPick(c.key)}
              className={`rounded-2xl border py-3 text-[13px] transition ${c.cls} ${
                pick === c.key ? "ring-2 ring-white/50" : "opacity-70"
              }`}
            >
              <span className="block text-foreground">{c.label}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.pay}</span>
            </button>
          ))}
        </div>
      </div>

      <BetBar stake={stake} onStake={setStake} balance={balance} busy={busy} label="Spin" onPlay={() => void play()} />
    </div>
  );
};

export default RouletteGame;
