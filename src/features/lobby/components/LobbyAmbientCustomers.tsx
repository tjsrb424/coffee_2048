"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  lane: number;
  size: number;
  hue: "cream" | "mint" | "rose";
  lifetimeMs: number;
  kind?: "ambient" | "purchase";
};

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const COLORS: Record<Customer["hue"], string> = {
  cream: "bg-cream-200/70 ring-coffee-600/10",
  mint: "bg-accent-mint/25 ring-accent-mint/35",
  rose: "bg-accent-rose/20 ring-accent-rose/35",
};

export function LobbyAmbientCustomers({
  className,
  density = 3,
  purchasePulse,
  purchaseKind = "online",
}: {
  className?: string;
  /** 1~5 권장. 높을수록 더 자주 등장 */
  density?: number;
  /** 값이 바뀔 때마다 '구매' 연출을 1회 발생 */
  purchasePulse?: number;
  purchaseKind?: "online" | "offline";
}) {
  const [items, setItems] = useState<Customer[]>([]);

  const lanes = useMemo(() => [18, 44, 70], []);
  const spawnEveryMs = Math.max(900, 2600 - density * 360);
  const lastPurchaseRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const spawn = () => {
      if (!mounted) return;
      const lane = Math.floor(Math.random() * lanes.length);
      const size = 18 + Math.floor(Math.random() * 12);
      const hue: Customer["hue"] =
        Math.random() < 0.16 ? "mint" : Math.random() < 0.2 ? "rose" : "cream";
      const lifetimeMs = 5200 + Math.floor(Math.random() * 2400);
      const c: Customer = {
        id: makeId(),
        lane,
        size,
        hue,
        lifetimeMs,
        kind: "ambient",
      };
      setItems((prev) => [...prev, c].slice(-10));
      window.setTimeout(() => {
        if (!mounted) return;
        setItems((prev) => prev.filter((x) => x.id !== c.id));
      }, lifetimeMs + 250);
    };

    spawn();
    const id = window.setInterval(spawn, spawnEveryMs);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [lanes.length, spawnEveryMs]);

  useEffect(() => {
    if (purchasePulse == null) return;
    if (lastPurchaseRef.current === purchasePulse) return;
    lastPurchaseRef.current = purchasePulse;

    const lane = Math.floor(Math.random() * lanes.length);
    const size = purchaseKind === "offline" ? 22 : 20;
    const hue: Customer["hue"] = purchaseKind === "offline" ? "mint" : "cream";
    const lifetimeMs = 1650;
    const c: Customer = {
      id: makeId(),
      lane,
      size,
      hue,
      lifetimeMs,
      kind: "purchase",
    };
    setItems((prev) => [...prev, c].slice(-12));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== c.id));
    }, lifetimeMs + 350);
  }, [lanes.length, purchaseKind, purchasePulse]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-[84px] overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <AnimatePresence>
        {items.map((c) => (
          <motion.div
            key={c.id}
            className={cn(
              "absolute left-[-12%] top-0 rounded-full ring-1 shadow-sm",
              COLORS[c.hue],
            )}
            style={{
              width: c.size,
              height: c.size,
              top: `${lanes[c.lane]}%`,
              filter: "blur(0.1px)",
            }}
            initial={{ opacity: 0, x: 0, scale: 0.92 }}
            animate={
              c.kind === "purchase"
                ? {
                    opacity: [0, 0.92, 0.92, 0],
                    x: ["0%", "86%", "96%"],
                    scale: [0.9, 1.02, 0.6],
                  }
                : {
                    opacity: [0, 0.85, 0.85, 0],
                    x: ["0%", "118%"],
                    scale: [0.92, 1, 1, 0.98],
                  }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: c.lifetimeMs / 1000,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

