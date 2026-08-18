// Ads helper: RichAds first, Adsgram as automatic fallback.
// RichAds SDK + Adsgram SDK are loaded in index.html.

const AD_METHODS = [
  "triggerRewardedVideo",
  "triggerRewardedInterstitial",
  "triggerInterstitialVideo",
  "triggerInterstitialBanner",
  "triggerPushStyleAd",
  "triggerPush",
] as const;

// Adsgram block id (set VITE_ADSGRAM_BLOCK_ID in env, or window.ADSGRAM_BLOCK_ID).
const ADSGRAM_BLOCK_ID =
  (import.meta.env.VITE_ADSGRAM_BLOCK_ID as string | undefined) ||
  ((window as any).ADSGRAM_BLOCK_ID as string | undefined) ||
  "";

export const isRichAdsReady = () => {
  const controller = (window as any).TelegramAdsController;
  if (!controller) return false;
  return AD_METHODS.some((m) => typeof controller[m] === "function");
};

export const isAdsgramReady = () =>
  typeof (window as any).Adsgram?.init === "function" && !!ADSGRAM_BLOCK_ID;

export const isAdsReady = () => isRichAdsReady() || isAdsgramReady();

const showRichAd = async (): Promise<boolean> => {
  const controller = (window as any).TelegramAdsController;
  if (!controller) return false;
  for (const method of AD_METHODS) {
    if (typeof controller[method] !== "function") continue;
    try {
      await controller[method]();
      return true;
    } catch {
      // try the next available ad format
    }
  }
  return false;
};

let adsgramController: any = null;
const getAdsgram = () => {
  if (!isAdsgramReady()) return null;
  if (!adsgramController) {
    try {
      adsgramController = (window as any).Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    } catch {
      adsgramController = null;
    }
  }
  return adsgramController;
};

const showAdsgramAd = async (): Promise<boolean> => {
  const controller = getAdsgram();
  if (!controller) return false;
  try {
    const res = await controller.show();
    // Adsgram resolves with { done: true } when the ad was fully watched.
    return res?.done !== false;
  } catch {
    return false;
  }
};

/**
 * Shows one ad with mutual fallback: the two networks back each other up.
 * Sources are alternated so load is shared, and if the first one has no ad
 * the other one is tried immediately.
 */
let lastSource: "rich" | "adsgram" = "adsgram";

export const showAd = async (): Promise<boolean> => {
  const richFirst = lastSource === "adsgram";
  const order: Array<"rich" | "adsgram"> = richFirst ? ["rich", "adsgram"] : ["adsgram", "rich"];

  for (const source of order) {
    const ok = source === "rich" ? await showRichAd() : await showAdsgramAd();
    if (ok) {
      lastSource = source;
      return true;
    }
  }
  return false;
};
