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
  render: () => JSX.Element;
}

const GAMES: GameEntry[] = [
  { slug: "slots", name: "Lucky Slots", tagline: "Three of a kind up to ×100", render: () => <SlotsGame /> },
  { slug: "crash", name: "Crash", tagline: "Cash out before the bust", render: () => <CrashGame /> },
  { slug: "roulette", name: "Roulette", tagline: "Red, black or zero", render: () => <RouletteGame /> },
  { slug: "dice", name: "Dice", tagline: "Pick your own odds", render: () => <DiceGame /> },
  { slug: "coinflip", name: "Coin Flip", tagline: "Heads or tails ×1.96", render: () => <CoinFlipGame /> },
  { slug: "wheel", name: "Fortune Wheel", tagline: "Spin for up to ×25", render: () => <WheelGame /> },
];

const GamesPage = () => {
  const { user } = useApp();
  const [active, setActive] = useState<GameEntry | null>(null);
  const balance = Number(user.tonBalance || 0);

  return (
    <div className="min-h-screen pb-28">
      <SpotlightHero title="Games">
        <div className="px-5 pt-6">
          <div className="paper-row mb-6 flex items-center justify-between px-4 py-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Your balance</span>
            <span className="flex items-center gap-2 font-display text-[16px] text-foreground">
              <img src="/images/gram-icon.png" alt="" className="h-5 w-5 rounded-full object-cover" />
              {fmt(balance)} Gram
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((game, i) => (
              <motion.button
                key={game.slug}
                type="button"
                onClick={() => setActive(game)}
                className="paper-row overflow-hidden p-0 text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.05 }}
              >
                <img
                  src={gameArt(game.slug, game.name)}
                  alt={game.name}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="px-3 py-2.5">
                  <p className="truncate font-display text-[14px] leading-tight text-foreground">{game.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{game.tagline}</p>
                </div>
              </motion.button>
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
                Balance {fmt(balance)} Gram · real stakes
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

          <div className="px-5 pb-10">{active.render()}</div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
