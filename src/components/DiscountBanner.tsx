import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import type { PaymentDiscount } from "@/hooks/use-payment-discount";

interface Props {
  discount: PaymentDiscount;
  /** Asks the AI strategist for a personalised bonus on this surface. */
  onSmartOffer?: () => void;
  thinking?: boolean;
}

/** Compact membership card: the saving, the progress to the next tier, one action. */
const DiscountBanner = ({ discount, onSmartOffer, thinking }: Props) => {
  if (!discount) return null;

  const hasDiscount = discount.discount_pct > 0;
  const hasAi = discount.ai_bonus_pct > 0 && !!discount.ai_headline;
  const nextPct = discount.next_tier_pct;
  const remaining = discount.remaining_to_next_ton;
  const nextTon = discount.next_tier_ton;
  const progress =
    nextTon && nextTon > 0 ? Math.min(100, Math.max(4, (discount.total_spent_ton / nextTon) * 100)) : 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="paper-card mb-5 overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="paper-eyebrow">{hasDiscount ? discount.tier_label : "Member pricing"}</p>
          <p className="mt-1 font-display text-[19px] leading-tight text-foreground">
            {discount.first_purchase
              ? "First purchase deal"
              : hasDiscount
                ? "Applied to every purchase"
                : "Spend to unlock discounts"}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/12 bg-white/10 px-3 py-2 text-center">
          <span className="font-display text-2xl leading-none text-foreground">{discount.discount_pct}%</span>
          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.2em] text-muted-foreground">off</span>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {remaining !== null && nextPct !== null ? `${remaining} Gram → ${nextPct}% off` : "Max tier reached"}
      </p>

      {hasAi ? (
        <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.06] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-foreground" />
            <p className="min-w-0 flex-1 truncate font-display text-sm text-foreground">{discount.ai_headline}</p>
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">
              +{discount.ai_bonus_pct}%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{discount.ai_message}</p>
        </div>
      ) : (
        onSmartOffer && (
          <button
            type="button"
            onClick={onSmartOffer}
            disabled={thinking}
            className="btn-ink mt-4 h-11 w-full text-[11px] font-semibold uppercase tracking-widest"
          >
            {thinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {thinking ? "Building your offer…" : "Get my AI offer"}
          </button>
        )
      )}
    </motion.section>
  );
};

export default DiscountBanner;
