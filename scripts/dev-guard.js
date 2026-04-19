#!/usr/bin/env node
"use strict";

/**
 * Next dev 서버에서 간헐적으로 발생하는 "Cannot find module './611.js'" 같은
 * 청크 누락/캐시 꼬임 런타임 에러를 감지하면:
 * - dev 프로세스를 종료
 * - .next 삭제
 * - dev 재시작
 *
 * Tailwind 위험 패턴(check:tw)도 dev 시작 전에 먼저 확인한다.
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");
const FORWARDED_ARGS = process.argv.slice(2);

const MAX_RESTARTS = 2;
const RESTART_WINDOW_MS = 5 * 60 * 1000;

const ERROR_PATTERNS = [
  /Cannot find module '\.\/\d+\.js'/i,
  /__webpack_modules__\[[^\]]+\]\s+is not a function/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /ENOENT.*\.next/i,
];

function log(line) {
  process.stdout.write(line.endsWith("\n") ? line : line + "\n");
}

function rmNext() {
  try {
    fs.rmSync(NEXT_DIR, { recursive: true, force: true });
  } catch (_) {
    // ignore
  }
}

function runCheckTwOrExit() {
  try {
    execSync("npm run check:tw", { stdio: "inherit" });
  } catch (e) {
    process.exitCode = 1;
    process.exit(1);
  }
}

function killTree(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
    } catch (_) {
      // ignore
    }
  } else {
    try {
      child.kill("SIGINT");
    } catch (_) {
      // ignore
    }
  }
}

let child = null;
let restartTimes = [];
let restarting = false;

function canRestartNow() {
  const now = Date.now();
  restartTimes = restartTimes.filter((t) => now - t < RESTART_WINDOW_MS);
  return restartTimes.length < MAX_RESTARTS;
}

function spawnDev() {
  const isWin = process.platform === "win32";
  const baseArgs = ["next", "dev", "-H", "0.0.0.0", ...FORWARDED_ARGS];
  const cmd = isWin ? "cmd.exe" : "npx";
  const args = isWin
    ? ["/d", "/s", "/c", ["npx", ...baseArgs].join(" ")]
    : baseArgs;
  child = spawn(cmd, args, {
    cwd: ROOT,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  const onData = (buf) => {
    const text = buf.toString();
    process.stdout.write(text);

    if (restarting) return;
    if (ERROR_PATTERNS.some((re) => re.test(text))) {
      restarting = true;
      const now = Date.now();
      if (!canRestartNow()) {
        log(
          "\n[dev-guard] 캐시/청크 오류가 반복되어 자동 복구를 중단합니다.\n" +
            "다음 순서로 정리해 주세요: npm run clean && npm install && npm run dev:clean\n",
        );
        killTree(child);
        process.exit(1);
        return;
      }
      restartTimes.push(now);
      log("\n[dev-guard] 청크/캐시 오류 감지 → .next 삭제 후 dev 재시작합니다...\n");
      killTree(child);
      rmNext();
      setTimeout(() => {
        restarting = false;
        spawnDev();
      }, 800);
    }
  };

  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  child.on("exit", (code, signal) => {
    if (restarting) return;
    if (code && code !== 0) {
      log(
        `\n[dev-guard] dev 프로세스가 비정상 종료(code=${code}, signal=${signal ?? "none"}).\n` +
          "필요하면 npm run dev:clean 또는 npm run dev:guard로 다시 실행하세요.\n",
      );
    }
  });
}

function main() {
  runCheckTwOrExit();
  rmNext();
  spawnDev();

  process.on("SIGINT", () => {
    killTree(child);
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    killTree(child);
    process.exit(0);
  });
}

main();

