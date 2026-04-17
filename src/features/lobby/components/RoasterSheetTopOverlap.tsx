"use client";

import Image from "next/image";
import { publicAssetPath } from "@/lib/publicAssetPath";

/** 로스터 시트 상단에 걸치는 로스팅기 일러스트(시트 윗변 기준 반은 밖·반은 안). */
export function RoasterSheetTopOverlap() {
  return (
    <Image
      src={publicAssetPath("/images/ui/roaster-machine-2.png")}
      alt=""
      width={1120}
      height={1120}
      className="h-[23rem] w-full max-w-[50rem] object-contain drop-shadow-[0_12px_28px_rgb(62_47_35_/_0.3)] sm:h-96"
      priority={false}
    />
  );
}
