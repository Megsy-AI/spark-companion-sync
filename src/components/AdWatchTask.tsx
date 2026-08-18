import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { showAd } from "@/lib/telegram-ads";
import {
  AD_TASK_GOAL,
  AD_TASK_GOAL_B,
  AD_TASK_REWARD,
  AD_TASK_REWARD_B,
  AdTier,
  claimAdRewardForTelegram,
  getAdProgressForTelegram,
  incrementAdWatchForTelegram,
} from "@/lib/game-api";

const AdWatchTask = () => {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const [watched, setWatched] = useState(0);
  const [watchedB, setWatchedB] = useState(0);
  const [busy, setBusy] = useState<AdTier | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await getAdProgressForTelegram(user.telegramUser.id);
        if (!active) return;
        setWatched(res?.adsWatched ?? 0);
        setWatchedB(res?.adsWatchedB ?? 0);
      } catch {
        // keep zero on failure
      }
    })();
    return () => {
      active = false;
    };
  }, [user.telegramUser.id, user.profileId]);

  const handleWatch = async (tier: AdTier) => {
    if (busy) return;
    setBusy(tier);
    try {
      const shown = await showAd();
      if (!shown) {
        toast({ title: "No ad available", description: "Try again in a moment", variant: "destructive" });
        return;
      }
      const res = await incrementAdWatchForTelegram(user.telegramUser.id, tier);
      if (res?.success) {
        setWatched(res.adsWatched ?? 0);
        setWatchedB(res.adsWatchedB ?? 0);
      }
    } catch {
      toast({ title: "Ad failed", description: "Please try again", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleClaim = async (tier: AdTier) => {
    if (busy) return;
    setBusy(tier);
    const goal = tier === "b" ? AD_TASK_GOAL_B : AD_TASK_GOAL;
    const reward = tier === "b" ? AD_TASK_REWARD_B : AD_TASK_REWARD;
    try {
      const res = await claimAdRewardForTelegram(user.telegramUser.id, tier);
      if (!res?.success) {
        toast({
          title: "Not yet!",
          description: `Watch ${goal} ads first (current: ${res?.adsWatched ?? (tier === "b" ? watchedB : watched)})`,
          variant: "destructive",
        });
        return;
      }
      if (tier === "b") setWatchedB(res.adsWatched ?? 0);
      else setWatched(res.adsWatched ?? 0);
      if (res.balances) {
        setUser((prev) => ({
          ...prev,
          siriBalance: res.balances!.siri,
          tonBalance: res.balances!.ton,
          usdtBalance: res.balances!.usdt,
        }));
      }
      toast({ title: "Reward Claimed!", description: `+${reward} Gram` });
    } catch {
      toast({ title: "Claim failed", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const renderTier = (tier: AdTier) => {
    const goal = tier === "b" ? AD_TASK_GOAL_B : AD_TASK_GOAL;
    const reward = tier === "b" ? AD_TASK_REWARD_B : AD_TASK_REWARD;
    const count = tier === "b" ? watchedB : watched;
    const ready = count >= goal;
    const progress = Math.min((count / goal) * 100, 100);
    const loading = busy === tier;

    return (
      <div className="rounded-2xl p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15">
            <PlayCircle className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Watch {goal} ads</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {count}/{goal} watched
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 font-display text-[11px] font-bold text-accent">
            +{reward} Gram
          </span>
        </div>

        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <button
          type="button"
          disabled={!!busy}
          onClick={() => void (ready ? handleClaim(tier) : handleWatch(tier))}
          className="mt-3 w-full rounded-full h-10 font-display text-xs uppercase tracking-widest bg-primary text-primary-foreground disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          {loading ? "Loading..." : ready ? `Claim ${reward} Gram` : "Watch Ad"}
        </button>
      </div>
    );
  };

  return (
    <motion.div
      layout
      className="relative rounded-2xl glass glass-panel border border-primary/30 mb-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -top-2 right-3 bg-accent text-accent-foreground text-[9px] font-display font-bold px-2 py-0.5 rounded-full shadow-lg">
        PINNED
      </div>
      {renderTier("a")}
      <div className="mx-3.5 h-px bg-border/60" />
      {renderTier("b")}
    </motion.div>
  );
};

export default AdWatchTask;
