"use strict";

/**
 * Tailwind JIT은 class 문자열 안 `[ ... ]` 에서 쉼표를 특별 처리한다.
 * `[min(92vw,21rem)]`, `[max(a,b)]` 같은 값은 전체 CSS 생성이 깨져
 * "스타일이 통째로 사라지고 흰 배경"으로 이어질 수 있다.
 *
 * 이 스크립트는 "개발 중 흰 화면"으로 이어질 수 있는 임의값 패턴을
 * 최대한 넓게 잡아내는 가드다.
 */

const fs = require("fs");
const path = require("path");

const FILE_RE = /\.(tsx|jsx|css)$/;
const PATTERNS = [
  { re: /\[min\(/g, hint: "[min( — 쉼표 포함 임의값은 Tailwind에서 위험" },
  { re: /\[max\(/g, hint: "[max( — 동일" },
];

function findLineNumber(s, idx) {
  // 1-indexed line number
  let line = 1;
  for (let i = 0; i < idx; i++) if (s.charCodeAt(i) === 10) line++;
  return line;
}

function collectBracketArbitraryWithComma(s) {
  // TSX/JSX에서는 실제 Tailwind class 문자열(= className)에서만 체크해야 한다.
  // 일반 JS 배열/훅 deps(`[a, b]`)까지 잡아버리면 노이즈가 너무 커진다.
  const hits = [];
  const classNameRe =
    /className\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g;
  for (const m of s.matchAll(classNameRe)) {
    const raw = m[1] ?? m[2] ?? m[3] ?? "";
    const idx = m.index ?? 0;
    const br = raw.match(/\[[^\]\n]*,[^\]\n]*\]/g);
    if (!br) continue;
    for (const b of br) {
      hits.push({ idx, match: b });
    }
  }

  // cn("...") / clsx("...") 형태도 흔해서, 문자열 인자 안에서만 추가 체크.
  const fnStringRe = /\b(?:cn|clsx)\(\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const m of s.matchAll(fnStringRe)) {
    const raw = m[1] ?? m[2] ?? "";
    const idx = m.index ?? 0;
    const br = raw.match(/\[[^\]\n]*,[^\]\n]*\]/g);
    if (!br) continue;
    for (const b of br) hits.push({ idx, match: b });
  }

  return hits;
}

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p, onFile);
    } else if (FILE_RE.test(ent.name)) {
      onFile(p);
    }
  }
}

let failed = false;
const root = path.join(process.cwd(), "src");

walk(root, (filePath) => {
  const s = fs.readFileSync(filePath, "utf8");

  // 1) 넓은 가드: [] 내부 쉼표
  const bracketHits =
    filePath.endsWith(".css")
      ? // CSS는 className 개념이 없어서 전체 스캔 (간단하지만 효과적)
        Array.from(s.matchAll(/\[[^\]\n]*,[^\]\n]*\]/g)).map((m) => ({
          idx: m.index ?? 0,
          match: m[0],
        }))
      : collectBracketArbitraryWithComma(s);
  if (bracketHits.length) {
    console.error(`[check-tailwind-risk] ${filePath}`);
    for (const h of bracketHits.slice(0, 12)) {
      const line = findLineNumber(s, h.idx);
      console.error(`  L${line} → ${h.match}  (대괄호 내부 쉼표 위험)`);
    }
    if (bracketHits.length > 12) {
      console.error(`  ... (+${bracketHits.length - 12}개 더 있음)`);
    }
    failed = true;
  }

  // 2) 힌트용: 특정 함수 패턴 (쉼표가 없어도 주의 환기)
  for (const { re, hint } of PATTERNS) {
    for (const m of s.matchAll(re)) {
      const idx = m.index ?? 0;
      const line = findLineNumber(s, idx);
      console.error(`[check-tailwind-risk] ${filePath}\n  L${line} → ${hint}`);
      failed = true;
      break;
    }
  }
});

if (failed) {
  console.error(
    "\n해결: 쉼표 없는 클래스로 나누기 (예: max-w-[21rem]) 또는 style={{}} 사용.\n" +
      "팁: 안전한 대체는 `w-full max-w-[20rem]`처럼 유틸을 조합하거나,\n" +
      "    `style={{ maxWidth: 'min(100%, 20rem)' }}`로 옮기는 방식.\n",
  );
  process.exit(1);
}

console.log("[check-tailwind-risk] OK");
