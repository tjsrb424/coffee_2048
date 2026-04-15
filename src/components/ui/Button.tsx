"use client";

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type MotionButtonProps = React.ComponentPropsWithoutRef<typeof motion.button>;

export type ButtonProps = Omit<MotionButtonProps, "variant"> & {
  variant?: "primary" | "ghost" | "soft";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", children, ...props }, ref) {
    const reduce = useReducedMotion();
    return (
      <motion.button
        ref={ref}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        whileHover={reduce ? undefined : { y: -1 }}
        transition={{ type: "spring", stiffness: 520, damping: 28 }}
        className={cn(
          "inline-flex min-h-[48px] items-center justify-center rounded-2xl px-5 text-[15px] font-semibold tracking-tight shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-soft/70 disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-gradient-to-b from-coffee-600 to-coffee-700 text-cream-50 shadow-card hover:from-coffee-600 hover:to-coffee-600",
          variant === "soft" &&
            "bg-cream-200 text-coffee-800 ring-1 ring-black/5 hover:bg-cream-300",
          variant === "ghost" &&
            "bg-transparent text-coffee-800 ring-1 ring-coffee-600/15 hover:bg-cream-200/80",
          className,
        )}
        {...props}
        data-ui-click="true"
      >
        {children}
      </motion.button>
    );
  },
);
