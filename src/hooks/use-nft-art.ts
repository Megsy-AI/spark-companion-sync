import { useEffect, useState } from "react";

/** Official artwork from the public TON collection, used as NFT/server images. */
const COLLECTION = "EQDFiSDU87TEvY67yqx0dTLQ-xHKbrR84dYfrYXWa5FWtMiu";
const ENDPOINT = `https://tonapi.io/v2/nfts/collections/${COLLECTION}/items?limit=40&offset=0`;
const CACHE_KEY = "nft-art-v1";
const TTL = 6 * 60 * 60 * 1000;

const readCache = (): string[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > TTL) return null;
    return parsed.images as string[];
  } catch {
    return null;
  }
};

/** Returns a stable list of NFT image URLs (empty while loading / offline). */
export const useNftArt = (): string[] => {
  const [images, setImages] = useState<string[]>(() => readCache() ?? []);

  useEffect(() => {
    if (images.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) return;
        const json = await res.json();
        const rows: string[] = (json.nft_items ?? [])
          .map(
            (n: any) =>
              (n.previews?.find((p: any) => p.resolution === "500x500")?.url as string) ??
              (n.previews?.[1]?.url as string) ??
              (n.metadata?.image as string) ??
              "",
          )
          .filter(Boolean);
        if (cancelled || !rows.length) return;
        setImages(rows);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), images: rows }));
        } catch {
          /* ignore */
        }
      } catch {
        /* keep local artwork */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [images.length]);

  return images;
};
