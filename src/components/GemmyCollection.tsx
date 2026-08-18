import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLLECTION = "EQDFiSDU87TEvY67yqx0dTLQ-xHKbrR84dYfrYXWa5FWtMiu";
const ENDPOINT = `https://tonapi.io/v2/nfts/collections/${COLLECTION}/items?limit=12&offset=0`;
const CACHE_KEY = "gemmy-items-v1";
const TTL = 30 * 60 * 1000;

interface Item {
  id: string;
  name: string;
  image: string;
  rarity: string;
}

const readCache = (): Item[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > TTL) return null;
    return parsed.items as Item[];
  } catch {
    return null;
  }
};

/** Live gallery of the Getgems collection: official artwork + names. */
const GemmyCollection = () => {
  const [items, setItems] = useState<Item[]>(() => readCache() ?? []);

  useEffect(() => {
    if (items.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) return;
        const json = await res.json();
        const rows: Item[] = (json.nft_items ?? [])
          .map((n: any) => ({
            id: n.address as string,
            name: (n.metadata?.name as string) ?? "Gemmy",
            image: (n.previews?.[1]?.url as string) ?? (n.metadata?.image as string) ?? "",
            rarity:
              (n.metadata?.attributes ?? []).find((a: any) => /rarity/i.test(a.trait_type))?.value ?? "Collectible",
          }))
          .filter((n: Item) => n.image);
        if (cancelled || !rows.length) return;
        setItems(rows);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items: rows }));
        } catch {
          /* ignore */
        }
      } catch {
        /* offline — hide section */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="paper-eyebrow">Gemmy collection</h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Getgems</span>
      </div>

      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <motion.article
            key={item.id}
            className="paper-card w-[152px] shrink-0 snap-start overflow-hidden p-2.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
          >
            <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-2 truncate font-display text-[13px] leading-tight text-foreground">{item.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.rarity}</p>
          </motion.article>
        ))}
      </div>
    </div>
  );
};

export default GemmyCollection;
