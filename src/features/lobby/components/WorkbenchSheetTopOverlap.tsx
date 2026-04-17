"use client";

import Image from "next/image";
import { publicAssetPath } from "@/lib/publicAssetPath";

/** 작업대 시트 상단에 걸치는 일러스트(시트 윗변 기준 반은 밖·반은 안). 투명 영역이 있어 제목과 겹쳐도 됨. */
export function WorkbenchSheetTopOverlap() {
  return (
    <Image
      src={publicAssetPath("/images/ui/workbench.png")}
      alt=""
      width={1120}
      height={1120}
      className="h-[19rem] w-full max-w-[36rem] object-contain drop-shadow-[0_12px_28px_rgb(62_47_35_/_0.3)] sm:h-80"
      priority={false}
    />
  );
}
