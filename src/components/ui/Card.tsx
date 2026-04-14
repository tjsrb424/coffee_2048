"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type MotionDivProps = React.ComponentPropsWithoutRef<typeof motion.div>;

export function Card({ className, children, ...rest }: MotionDivProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={false}
      whileHover={reduce ? undefined : { y: -2, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={cn(
        "rounded-3xl bg-cream-50/90 p-5 shadow-card ring-1 ring-coffee-600/10 backdrop-blur-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
