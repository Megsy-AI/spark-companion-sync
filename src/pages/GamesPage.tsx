import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import SpotlightHero from "@/components/hero/SpotlightHero";
import { useApp } from "@/context/AppContext";
import { gameArt } from "@/lib/game-art";
import { fmt } from "@/lib/casino";
import SlotsGame from "@/components/games/SlotsGame";
import CrashGame from "@/components/games/CrashGame";
import DiceGame from "@/components/games/DiceGame";
import CoinFlipGame from "@/components/games/CoinFlipGame";
import RouletteGame from "@/components/games/RouletteGame";
import WheelGame from "@/components/games/WheelGame";

interface GameEntry {
  slug: string;
  name: string;
  tagline: string;
  render?: () => JSX.Element;
  /** Self-hosted static game served from /public/games. */
  src?: string;
  cover?: string;
}

const CASINO: GameEntry[] = [
  { slug: "slots", name: "Lucky Slots", tagline: "Three of a kind up to ×100", render: () => <SlotsGame /> },
  { slug: "crash", name: "Crash", tagline: "Cash out before the bust", render: () => <CrashGame /> },
  { slug: "roulette", name: "Roulette", tagline: "Red, black or zero", render: () => <RouletteGame /> },
  { slug: "dice", name: "Dice", tagline: "Pick your own odds", render: () => <DiceGame /> },
  { slug: "coinflip", name: "Coin Flip", tagline: "Heads or tails ×1.96", render: () => <CoinFlipGame /> },
  { slug: "wheel", name: "Fortune Wheel", tagline: "Spin for up to ×25", render: () => <WheelGame /> },
];

const ARCADE: GameEntry[] = [
  {
    slug: "hexgl",
    name: "HexGL",
    tagline: "Futuristic WebGL racer",
    src: "/games/HexGL/index.html",
    cover: "/games/HexGL/icon_256.png",
  },
  {
    slug: "hextris",
    name: "Hextris",
    tagline: "Fast hexagon puzzle",
    src: "/games/hextris/index.html",
    cover: "/games/hextris/images/logo.png",
  },
  {
    slug: "2048",
    name: "2048",
    tagline: "Slide and merge tiles",
    src: "/games/2048/index.html",
    cover: "/games/2048/meta/apple-touch-icon.png",
  },
  {
    slug: "astray",
    name: "Astray",
    tagline: "3D marble maze",
    src: "/games/Astray/index.html",
  },
  {
    slug: "clumsy-bird",
    name: "Clumsy Bird",
    tagline: "One-tap arcade classic",
    src: "/games/clumsy-bird/index.html",
    cover: "/games/clumsy-bird/data/img/gui/logo.png",
  },
  {
    slug: "pacman",
    name: "Pac-Man",
    tagline: "Chase the pellets",
    src: "/games/pacman-canvas/index.html",
    cover: "/games/pacman-canvas/img/apple-touch-icon.png",
  },
];

const GamesPage = () => {
  const { user } = useApp();
  const [active, setActive] = useState<GameEntry | null>(null);
  const balance = Number(user.tonBalance || 0);

  const Card = ({ game, i }: { game: GameEntry; i: number }) => (
    <motion.button
      type="button"
      onClick={() => setActive(game)}
      className="paper-row overflow-hidden p-0 text-left"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.05 }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
        <img
          src={gameArt(game.slug, game.name)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {game.cover && (
          <img
            src={game.cover}
            alt={game.name}
            className="absolute inset-0 m-auto h-3/5 w-3/5 object-contain drop-shadow-lg"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate font-display text-[14px] leading-tight text-foreground">{game.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{game.tagline}</p>
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen pb-28">
      <SpotlightHero title="Games">
        <div className="px-5 pt-6">
          <div className="paper-row mb-6 flex items-center justify-between px-4 py-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Your balance</span>
            <span className="flex items-center gap-2 font-display text-[16px] text-foreground">
              <img src="/images/ton-icon.jpg" alt="" className="h-5 w-5 rounded-full object-cover" />
              {fmt(balance)} Gram
            </span>
          </div>

          <p className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">Play with Gram</p>
          <div className="grid grid-cols-2 gap-3">
            {CASINO.map((game, i) => (
              <Card key={game.slug} game={game} i={i} />
            ))}
          </div>

          <p className="mb-3 mt-8 text-[11px] uppercase tracking-widest text-muted-foreground">Arcade · free to play</p>
          <div className="grid grid-cols-2 gap-3">
            {ARCADE.map((game, i) => (
              <Card key={game.slug} game={game} i={i} />
            ))}
          </div>
        </div>
      </SpotlightHero>

      {active && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(82px+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col overflow-y-auto bg-background">
          <div className="flex items-center justify-between gap-3 px-5 pt-safe">
            <div className="min-w-0 py-4">
              <p className="truncate font-display text-[17px] text-foreground">{active.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {active.src ? "Free play · no stake" : `Balance ${fmt(balance)} Gram · real stakes`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close game"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {active.src ? (
            <div className="flex-1 px-3 pb-4">
              <iframe
                src={active.src}
                title={active.name}
                className="h-full min-h-[70vh] w-full rounded-3xl border border-white/12 bg-black"
                allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
              />
            </div>
          ) : (
            <div className="px-5 pb-10">{active.render?.()}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GamesPage;
