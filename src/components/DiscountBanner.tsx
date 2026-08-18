import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import type { PaymentDiscount } from "@/hooks/use-payment-discount";

interface Props {
  discount: PaymentDiscount;
  /** Asks the AI strategist for a personalised bonus on this surface. */
  onSmartOffer?: () => void;
  thinking?: boolean;
}

/** Coupon-style discount card: one number, one line of progress, one action. */
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
      className="paper-card mb-5 overflow-hidden p-0"
    >
      {/* Coupon head */}
      <div className="flex items-stretch">
        <div className="flex w-[92px] shrink-0 flex-col items-center justify-center border-r border-dashed border-border py-5">
          <span className="font-display text-[34px] leading-none tracking-tight text-foreground">
            {discount.discount_pct}
            <span className="text-lg align-top">%</span>
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">off</span>
        </div>

        <div className="min-w-0 flex-1 px-4 py-4">
          <p className="paper-eyebrow">{hasDiscount ? discount.tier_label : "Member pricing"}</p>
          <p className="mt-0.5 font-display text-[17px] leading-tight text-foreground">
            {discount.first_purchase
              ? "First purchase deal"
              : hasDiscount
                ? "Applied to every purchase"
                : "Spend to unlock discounts"}
          </p>

          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {remaining !== null && nextPct !== null
              ? `${remaining} Gram → ${nextPct}% off`
              : "Max tier reached"}
          </p>
        </div>
      </div>

      {/* Action / AI offer */}
      <div className="border-t border-dashed border-border px-4 py-3">
        {hasAi ? (
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-foreground" />
              <p className="min-w-0 flex-1 truncate font-display text-sm text-foreground">{discount.ai_headline}</p>
              <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                +{discount.ai_bonus_pct}%
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{discount.ai_message}</p>
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
              className="btn-ink h-11 w-full text-[11px] font-semibold uppercase tracking-widest"
            >
              {thinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {thinking ? "Building your offer…" : "Get my AI offer"}
            </button>
          )
        )}
      </div>
    </motion.section>
  );
};

export default DiscountBanner;
