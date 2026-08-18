import { useState } from "react";
import BetBar from "./BetBar";
import { errorText, fmt, playRound } from "@/lib/casino";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const DiceGame = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const balance = Number(user.tonBalance || 0);
  const [stake, setStake] = useState("0.5");
  const [target, setTarget] = useState(50);
  const [busy, setBusy] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  const multiplier = (96 / target).toFixed(2);

  const play = async () => {
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    const res = await playRound(user.telegramUser.id, "dice", amount, { target });
    if (!res.success) {
      toast({ title: "Roll failed", description: errorText(res.error), variant: "destructive" });
      setBusy(false);
      return;
    }
    setRoll(Number((res.outcome as any)?.roll ?? 0));
    setWon(Number(res.payout || 0) > 0);
    await refreshProfile();
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-6 text-center">
        <p className="font-display text-5xl text-foreground">{roll === null ? "—" : roll.toFixed(2)}</p>
        <p className={`mt-2 text-[13px] ${won && roll !== null ? "text-emerald-400" : "text-muted-foreground"}`}>
          {roll === null ? `Roll under ${target} to win ×${multiplier}` : won ? "You won" : "You lost"}
        </p>

        <div className="mt-6 space-y-2">
          <input
            type="range"
            min={2}
            max={95}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full accent-white"
          />
          <div className="flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>Under {target}</span>
            <span>Payout ×{multiplier}</span>
          </div>
        </div>
      </div>

      <BetBar stake={stake} onStake={setStake} balance={balance} busy={busy} label="Roll" onPlay={() => void play()} />
      {roll !== null && won && (
        <p className="text-center text-[12px] text-emerald-400">+{fmt(Number(stake) * Number(multiplier))} Gram</p>
      )}
    </div>
  );
};

export default DiceGame;
