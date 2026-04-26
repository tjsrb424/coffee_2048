import type { Page } from "@playwright/test";

/**
 * 스크린샷 직전에 애니메이션/캐럿을 끄고, 옵션에 따라 문서 스크롤을 잠급니다.
 * 퍼즐은 루트가 overflow-hidden이어도 body 스크롤바 유무에 따라 폭이 흔들릴 수 있어
 * lockDocumentScroll로 감쇠합니다. (로비 등 긴 페이지의 fullPage 캡처에는 쓰지 말 것.)
 */
export async function prepareVisualPage(
  page: Page,
  options?: { lockDocumentScroll?: boolean },
) {
  const lock = options?.lockDocumentScroll ?? false;
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      [data-visual-test-hidden="true"],
      button[aria-label="Open Next.js Dev Tools"] {
        display: none !important;
      }
      ${
        lock
          ? `
      html { overflow: hidden !important; }
      body { overflow: hidden !important; }
      `
          : ""
      }
    `,
  });
}
