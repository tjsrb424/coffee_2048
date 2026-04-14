"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const items = [
  { href: "/lobby", label: "로비" },
  { href: "/puzzle", label: "퍼즐" },
  { href: "/menu", label: "메뉴" },
] as const;

export function BottomNav() {
  const path = usePathname();
  const reduce = useReducedMotion();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-coffee-600/10 bg-cream-50/85 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map((it) => {
          const active = path === it.href || (it.href === "/lobby" && path === "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className="relative flex min-h-[52px] flex-1 flex-col items-center justify-center"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                  className="absolute inset-x-3 inset-y-1 rounded-2xl bg-cream-200/90 ring-1 ring-coffee-600/10"
                />
              )}
              <span
                className={cn(
                  "relative z-10 text-sm font-semibold",
                  active ? "text-coffee-900" : "text-coffee-600/70",
                )}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
