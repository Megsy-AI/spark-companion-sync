import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { PaymentError, sendTonPayment } from "@/lib/ton";
import { verifyTonOnChain } from "@/lib/game-api";

const TON_ICON = "/images/gram-icon.png";
const BASE_PRICE = 0.5;

type BoostKind = "time" | "yield";

const storageKey = (id: number | string, kind: BoostKind) => `nova-boost-${kind}-${id}`;

const readLevel = (id: number | string, kind: BoostKind) => {
  const raw = Number(localStorage.getItem(storageKey(id, kind)) ?? 0);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
};

/** Price grows with every purchase, starting at 0.5 Gram. */
const priceForLevel = (level: number) => Math.round(BASE_PRICE * Math.pow(1.6, level) * 100) / 100;

/** Two paid upgrades: longer mining cycle and a rewards multiplier that stacks. */
const MiningBoosters = () => {
  const { user } = useApp();
  const { toast } = useToast();
  const [tonConnectUI] = useTonConnectUI();
  const id = user.telegramUser.id;

  const [levels, setLevels] = useState<Record<BoostKind, number>>(() => ({
    time: readLevel(id, "time"),
    yield: readLevel(id, "yield"),
  }));
  const [busy, setBusy] = useState<BoostKind | null>(null);

  const buy = async (kind: BoostKind) => {
    const level = levels[kind];
    const amountTon = priceForLevel(level);
    setBusy(kind);
    try {
      const tx = await sendTonPayment(tonConnectUI, {
        amountTon,
        telegramId: id,
        action: "battle_item",
        metadata: { boost: kind, level: level + 1 },
      });
      const verification = await verifyTonOnChain(tx.intentId, tx.boc, tonConnectUI.account?.address);
      if (!verification.verified) {
        toast({ title: "Payment not verified", variant: "destructive" });
        return;
      }
      const next = level + 1;
      localStorage.setItem(storageKey(id, kind), String(next));
      setLevels((prev) => ({ ...prev, [kind]: next }));
      toast({
        title: kind === "time" ? "Cycle extended" : "Rewards multiplied",
        description: kind === "time" ? `+${next * 2}h per mining cycle` : `x${(1 + next * 0.5).toFixed(1)} rewards`,
      });
    } catch (err) {
      if (err instanceof PaymentError) {
        toast({
          title: err.code === "not_connected" ? "Wallet not connected" : "Payment failed",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Something went wrong", variant: "destructive" });
      }
    } finally {
      setBusy(null);
    }
  };

  const cards: { kind: BoostKind; icon: typeof Clock; title: string; effect: string }[] = [
    { kind: "time", icon: Clock, title: "Longer cycle", effect: `+${(levels.time + 1) * 2}h` },
    { kind: "yield", icon: Zap, title: "Multiply rewards", effect: `x${(1 + (levels.yield + 1) * 0.5).toFixed(1)}` },
  ];

  return (
    <motion.div
      className="nv-card mt-3 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="nv-eyebrow">Boosters</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {cards.map(({ kind, icon: Icon, title, effect }) => (
          <div key={kind} className="rounded-2xl border border-white/12 bg-white/[0.06] p-3.5">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-white" strokeWidth={1.8} />
              <p className="truncate text-[12px] font-medium text-white">{title}</p>
            </div>
            <p className="mt-1 font-display text-2xl leading-none text-white">{effect}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/55">
              {levels[kind] > 0 ? `Level ${levels[kind]}` : "Not active"}
            </p>

            <button
              type="button"
              onClick={() => void buy(kind)}
              disabled={busy === kind}
              className="btn-ink mt-3 h-10 w-full gap-1.5 text-[11px] font-semibold uppercase tracking-widest"
            >
              {busy === kind ? (
                <span className="animate-pulse">Paying…</span>
              ) : (
                <>
                  <img src={TON_ICON} alt="" className="h-3.5 w-3.5 rounded-full" loading="lazy" decoding="async" />
                  {priceForLevel(levels[kind])}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default MiningBoosters;
