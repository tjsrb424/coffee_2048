"use client";

import Image from "next/image";
import { publicAssetPath } from "@/lib/publicAssetPath";
import { cn } from "@/lib/utils";

export function EspressoShotIcon({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src={publicAssetPath("/images/optimized/ui/espresso-shot.webp")}
      alt=""
      width={size}
      height={size}
      className={cn("inline-block align-middle", className)}
      priority={false}
    />
  );
}
