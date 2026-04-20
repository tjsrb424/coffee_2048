"use client";

import Image from "next/image";
import { publicAssetPath } from "@/lib/publicAssetPath";

/** 카운터 시트 상단에 걸치는 계산대 일러스트. */
export function CounterSheetTopOverlap() {
  return (
    <Image
      src={publicAssetPath("/images/optimized/ui/counter-machine.webp")}
      alt=""
      width={1120}
      height={1120}
      className="h-[19rem] w-full max-w-[36rem] object-contain drop-shadow-[0_12px_28px_rgb(62_47_35_/_0.3)] sm:h-80"
      priority={false}
    />
  );
}
