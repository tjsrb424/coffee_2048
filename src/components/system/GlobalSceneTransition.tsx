"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSceneTransitionStore } from "@/stores/useSceneTransitionStore";

const REVEAL_MS = 220;

export function GlobalSceneTransition() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const visible = useSceneTransitionStore((s) => s.visible);
  const phase = useSceneTransitionStore((s) => s.phase);
  const token = useSceneTransitionStore((s) => s.token);
  const targetPath = useSceneTransitionStore((s) => s.targetPath);
  const reveal = useSceneTransitionStore((s) => s.reveal);
  const end = useSceneTransitionStore((s) => s.end);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    if (
      visible &&
      phase === "covering" &&
      (pathname !== prevPath || targetPath === pathname)
    ) {
      reveal();
    }
    prevPathRef.current = pathname;
  }, [pathname, phase, reveal, targetPath, visible]);

  useEffect(() => {
    if (!visible || phase !== "revealing") return;
    const timer = window.setTimeout(end, REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [end, phase, visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={token}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "covering" ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.12 }
              : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
          }
          className="pointer-events-none fixed inset-0 z-[140] bg-[#f6efe4]"
        />
      ) : null}
    </AnimatePresence>
  );
}
