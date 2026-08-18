import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import SpotlightHero from "@/components/hero/SpotlightHero";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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


const STAKES = [0.5, 1, 2, 5];

const GamesPage = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const telegramId = user.telegramUser.id;

  const [stake, setStake] = useState(STAKES[0]);
  const [active, setActive] = useState<Game | null>(null);
  const [betId, setBetId] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const settled = useRef(false);

  const canPlay = useMemo(() => Number(user.tonBalance || 0) >= stake, [user.tonBalance, stake]);

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
        ? { title: "You won!", description: `+${(data as any)?.payout ?? stake * 1.8} Gram credited` }
        : { title: "Round lost", description: "You left before the timer ended", variant: "destructive" },
    );
    setBetId(null);
  };

  const play = async (game: Game) => {
    if (!canPlay) {
      toast({ title: "Not enough Gram", description: `You need ${stake} Gram to enter`, variant: "destructive" });
      return;
    }
    setBusy(game.slug);
    try {
      const { data, error } = await (supabase as any).rpc("game_place_bet_for_telegram", {
        _telegram_id: telegramId,
        _game_slug: game.slug,
        _stake: stake,
      });
      if (error || !(data as any)?.success) {
        toast({
          title: "Could not start the round",
          description: (data as any)?.error === "insufficient_funds" ? "Not enough Gram" : "Please try again",
          variant: "destructive",
        });
        return;
      }
      settled.current = false;
      setBetId((data as any).bet_id as string);
      setLeft(game.challenge);
      setActive(game);
      await refreshProfile();
    } finally {
      setBusy(null);
    }
  };

  // Round timer: survive the challenge inside the game to win 1.8x the stake.
  useEffect(() => {
    if (!active || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, left]);

  useEffect(() => {
    if (active && left === 0 && betId) void settle(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, active]);

  const closeGame = async () => {
    if (betId && left > 0) await settle(false);
    setActive(null);
  };

  return (
    <div className="min-h-screen pb-28">
      <SpotlightHero title="Games">
        <div className="px-5 pt-6">
          <div className="paper-card mb-5 p-5">
            <p className="paper-eyebrow">Your stake</p>
            <p className="mt-1 font-display text-[19px] leading-tight text-foreground">
              Win 1.8x by finishing the round
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {STAKES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStake(s)}
                  className={`h-10 rounded-full border text-[12px] font-semibold transition-colors ${
                    stake === s
                      ? "border-transparent bg-white text-black"
                      : "border-white/14 bg-white/[0.06] text-white/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <img src={TON_ICON} alt="" className="h-3.5 w-3.5 rounded-full" loading="lazy" decoding="async" />
              Balance {Number(user.tonBalance || 0).toLocaleString("en-US", { maximumFractionDigits: 4 })} Gram
            </p>
          </div>

          {CATEGORIES.map((cat) => {
            const list = GAMES.filter((g) => g.category === cat);
            if (!list.length) return null;
            return (
              <div key={cat} className="mb-6">
                <h2 className="paper-eyebrow mb-3">{cat}</h2>
                <div className="space-y-3">
                  {list.map((game, i) => (
                    <motion.div
                      key={game.slug}
                      className="paper-row p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[16px] leading-tight text-foreground">{game.name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {game.tagline} · survive {game.challenge}s
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void play(game)}
                          disabled={busy === game.slug}
                          className="btn-ink h-10 shrink-0 gap-1.5 px-4 text-[11px] font-semibold uppercase tracking-widest"
                        >
                          <img src={TON_ICON} alt="" className="h-3.5 w-3.5 rounded-full" loading="lazy" decoding="async" />
                          {busy === game.slug ? "…" : `Bet ${stake}`}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}


          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Games are third-party open-source titles played inside the app
          </p>
        </div>
      </SpotlightHero>

      {active && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(82px+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-display text-[15px] text-white">{active.name}</p>
              <p className="text-[11px] text-white/60">
                {left > 0 ? `${left}s left · stake ${stake} Gram` : "Round complete"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void closeGame()}
              aria-label="Close game"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
