import { motion } from "framer-motion";
import { Loader2, Wand2 } from "lucide-react";
import type { PaymentDiscount } from "@/hooks/use-payment-discount";
import discountArt from "@/assets/discount-crown.jpg";


const TIER_ACCENT: Record<PaymentDiscount["tier"], string> = {
  none: "text-primary",
  bronze: "text-amber-500",
  silver: "text-slate-300",
  gold: "text-yellow-400",
  diamond: "text-cyan-300",
};

interface Props {
  discount: PaymentDiscount;
  /** Asks the AI strategist for a personalised bonus on this surface. */
  onSmartOffer?: () => void;
  thinking?: boolean;
}

/** Shows the player's active discount, the AI personal offer and next-tier progress. */
const DiscountBanner = ({ discount, onSmartOffer, thinking }: Props) => {
  if (!discount) return null;
  const hasDiscount = discount.discount_pct > 0;
  const hasAi = discount.ai_bonus_pct > 0 && !!discount.ai_headline;
  const accent = TIER_ACCENT[discount.tier];

  const nextPct = discount.next_tier_pct;
  const remaining = discount.remaining_to_next_ton;
  const nextTon = discount.next_tier_ton;
  const progress =
    nextTon && nextTon > 0 ? Math.min(100, Math.max(4, (discount.total_spent_ton / nextTon) * 100)) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="paper-card mb-5 overflow-hidden p-4"
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={discountArt}
            alt=""
            loading="lazy"
            decoding="async"
            width={512}
            height={512}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="paper-eyebrow">{hasDiscount ? discount.tier_label : "Member pricing"}</p>
              <p className="font-display text-lg leading-tight text-foreground">
                {discount.first_purchase
                  ? "First purchase, 20% off"
                  : hasDiscount
                    ? `You save ${discount.discount_pct}% on every buy`
                    : "Unlock member discounts"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border border-border bg-card px-2.5 py-1 font-display text-xs font-bold ${hasDiscount ? accent : "text-muted-foreground"}`}
            >
              -{discount.discount_pct}%
            </span>
          </div>

          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
            {remaining !== null && nextPct !== null
              ? `${remaining} Gram more → ${nextPct}% off forever`
              : "Max tier — best price on everything"}
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>


      {hasAi ? (
        <div className="mt-3 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Wand2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 truncate font-display text-[11px] font-bold text-foreground">
              {discount.ai_headline}
            </p>
            <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 font-display text-[10px] font-bold text-primary">
              +{discount.ai_bonus_pct}%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{discount.ai_message}</p>
          {discount.ai_expires_at && (
            <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
              Expires {new Date(discount.ai_expires_at).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        onSmartOffer && (
          <button
            type="button"
            onClick={onSmartOffer}
            disabled={thinking}
            className="liquid-press mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-[11px] font-bold uppercase tracking-widest text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {thinking ? "Building your offer…" : "Get my AI offer"}
          </button>
        )
      )}
    </motion.div>
  );
};

export default DiscountBanner;
