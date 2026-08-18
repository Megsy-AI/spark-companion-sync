import SpotlightHero from "@/components/hero/SpotlightHero";
import { useApp } from "@/context/AppContext";
import { fmt } from "@/lib/casino";
import AviatorGame from "@/components/games/AviatorGame";

const GamesPage = () => {
  const { user } = useApp();
  const balance = Number(user.tonBalance || 0);

  return (
    <div className="min-h-screen pb-28">
      <SpotlightHero title="Aviator">
        <div className="px-5 pt-6">
          <div className="paper-row mb-6 flex items-center justify-between px-4 py-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Your balance</span>
            <span className="flex items-center gap-2 font-display text-[16px] text-foreground">
              <img src="/images/ton-icon.jpg" alt="" className="h-5 w-5 rounded-full object-cover" />
              {fmt(balance)} Gram
            </span>
          </div>

          <AviatorGame />
        </div>
      </SpotlightHero>
    </div>
  );
};

export default GamesPage;
