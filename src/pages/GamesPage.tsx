import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import SpotlightHero from "@/components/hero/SpotlightHero";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { gameArt } from "@/lib/game-art";

const TON_ICON = "/images/gram-icon.png";

/** Open-source HTML5 games hosted on pages that allow embedding. */
interface Game {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  category: "Casino" | "Arcade" | "Puzzle" | "Board";
  /** Seconds the player must survive in the round to win the wager. */
  challenge: number;
}

const GAMES: Game[] = [
  {
    slug: "slot-machine",
    name: "Lucky Slots",
    tagline: "Spin the reels",
    url: "https://slotmachinescript.com/demo/",
    category: "Casino",
    challenge: 45,
  },
  {
    slug: "blackjack",
    name: "Blackjack 21",
    tagline: "Beat the dealer",
    url: "https://kevinnadar22.github.io/Blackjack/",
    category: "Casino",
    challenge: 60,
  },
  {
    slug: "roulette",
    name: "Roulette",
    tagline: "Red, black or zero",
    url: "https://mfetiu.github.io/roulette/",
    category: "Casino",
    challenge: 45,
  },
  {
    slug: "hextris",
    name: "Hextris",
    tagline: "Rotate and stack — fast reflexes",
    url: "https://hextris.github.io/hextris/",
    category: "Arcade",
    challenge: 60,
  },
  {
    slug: "clumsy-bird",
    name: "Clumsy Bird",
    tagline: "One tap, endless nerves",
    url: "https://ellisonleao.github.io/clumsy-bird/",
    category: "Arcade",
    challenge: 45,
  },
  {
    slug: "astray",
    name: "Astray",
    tagline: "3D marble maze runner",
    url: "https://wwwtyro.github.io/Astray/",
    category: "Arcade",
    challenge: 90,
  },
  {
    slug: "pacman",
    name: "Pac-Man",
    tagline: "The classic chase",
    url: "https://pacman.platzh1rsch.ch/",
    category: "Arcade",
    challenge: 60,
  },
  {
    slug: "tetris",
    name: "Tetris",
    tagline: "Stack the blocks",
    url: "https://chvin.github.io/react-tetris/?lan=en",
    category: "Arcade",
    challenge: 90,
  },
  {
    slug: "bananabread",
    name: "Banana Bread",
    tagline: "3D shooter arena",
    url: "https://kripken.github.io/BananaBread/cube2/game.html",
    category: "Arcade",
    challenge: 120,
  },
  {
    slug: "2048",
    name: "2048",
    tagline: "Slide the tiles, chase the number",
    url: "https://gabrielecirulli.github.io/2048/",
    category: "Puzzle",
    challenge: 90,
  },
  {
    slug: "untrusted",
    name: "Untrusted",
    tagline: "Hack your way out",
    url: "https://alexnisnevich.github.io/untrusted/",
    category: "Puzzle",
    challenge: 120,
  },
  {
    slug: "gomoku",
    name: "Gomoku",
    tagline: "Five in a row",
    url: "https://lihongxun945.github.io/gobang/",
    category: "Board",
    challenge: 90,
  },
  {
    slug: "chess",
    name: "Chess",
    tagline: "Play the engine",
    url: "https://chessboardjs.com/examples/5000",
    category: "Board",
    challenge: 120,
  },
];

const CATEGORIES = ["Casino", "Arcade", "Puzzle", "Board"] as const;

const GamesPage = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const telegramId = user.telegramUser.id;

  const [active, setActive] = useState<Game | null>(null);
  const [betId, setBetId] = useState<string | null>(null);
  const [stake, setStake] = useState<string>("");
  const [placed, setPlaced] = useState(0);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const settled = useRef(false);

  const balance = Number(user.tonBalance || 0);

  const settle = async (won: boolean) => {
    if (!betId || settled.current) return;
    settled.current = true;
    const { data } = await (supabase as any).rpc("game_settle_bet_for_telegram", {
      _telegram_id: telegramId,
      _bet_id: betId,
      _won: won,
    });
    await refreshProfile();
    toast(
      won
        ? { title: "You won!", description: `+${(data as any)?.payout ?? placed * 1.8} Gram credited` }
        : { title: "Round lost", description: "You left before the timer ended", variant: "destructive" },
    );
    setBetId(null);
  };

  const openGame = (game: Game) => {
    settled.current = false;
    setBetId(null);
    setStake("");
    setPlaced(0);
    setLeft(0);
    setActive(game);
  };

  const placeBet = async () => {
    if (!active) return;
    const amount = Number(stake);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a bet", description: "Type any amount you like", variant: "destructive" });
      return;
    }
    if (amount > balance) {
      toast({ title: "Not enough Gram", description: `Balance ${balance}`, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("game_place_bet_for_telegram", {
        _telegram_id: telegramId,
        _game_slug: active.slug,
        _stake: amount,
      });
      if (error || !(data as any)?.success) {
        toast({
          title: "Could not place the bet",
          description: (data as any)?.error === "insufficient_funds" ? "Not enough Gram" : "Please try again",
          variant: "destructive",
        });
        return;
      }
      settled.current = false;
      setBetId((data as any).bet_id as string);
      setPlaced(amount);
      setLeft(active.challenge);
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  };

  // Round timer: survive the challenge inside the game to win 1.8x the stake.
  useEffect(() => {
    if (!active || !betId || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, betId, left]);

  useEffect(() => {
    if (active && betId && left === 0 && placed > 0) void settle(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, active, betId]);

  const closeGame = async () => {
    if (betId && left > 0) await settle(false);
    setActive(null);
  };

  return (
    <div className="min-h-screen pb-28">
      <SpotlightHero title="Games">
        <div className="px-5 pt-6">
          {CATEGORIES.map((cat) => {
            const list = GAMES.filter((g) => g.category === cat);
            if (!list.length) return null;
            return (
              <div key={cat} className="mb-7">
                <h2 className="paper-eyebrow mb-3">{cat}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {list.map((game, i) => (
                    <motion.button
                      key={game.slug}
                      type="button"
                      onClick={() => openGame(game)}
                      className="paper-row overflow-hidden p-0 text-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                    >
                      <img
                        src={gameArt(game.slug, game.name)}
                        alt={game.name}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <p className="truncate px-3 py-2.5 font-display text-[14px] leading-tight text-foreground">
                        {game.name}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SpotlightHero>

      {active && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(82px+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col bg-background">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] text-foreground">{active.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {betId && left > 0
                  ? `${left}s left · ${placed} Gram at stake`
                  : `Optional bet · balance ${balance.toLocaleString("en-US", { maximumFractionDigits: 4 })} Gram`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void closeGame()}
              aria-label="Close game"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!betId && (
            <div className="flex items-center gap-2 px-4 pb-3">
              <div className="flex h-11 flex-1 items-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-4">
                <img src={TON_ICON} alt="" className="h-4 w-4 rounded-full object-cover" loading="lazy" />
                <input
                  value={stake}
                  onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  placeholder="Any amount"
                  className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="button"
                onClick={() => void placeBet()}
                disabled={busy}
                className="btn-ink h-11 shrink-0 px-5 text-[11px] font-semibold uppercase tracking-widest"
              >
                {busy ? "…" : "Bet"}
              </button>
            </div>
          )}

          <iframe
            title={active.name}
            src={active.url}
            className="w-full flex-1 border-0"
            allow="autoplay; fullscreen; gamepad"
          />
        </div>
      )}
    </div>
  );
};

export default GamesPage;

