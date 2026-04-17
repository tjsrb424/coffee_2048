import type { NextPageContext } from "next";

type Props = { statusCode?: number };

export default function ErrorPage({ statusCode }: Props) {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 bg-cream-100 px-6 pb-16 pt-10 text-center text-coffee-900">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-coffee-600/60">
        Coffee 2048
      </p>
      <p className="text-sm leading-relaxed text-coffee-800">
        {statusCode
          ? `잠깐 멈췄어요. (code ${statusCode})`
          : "잠깐 멈췄어요. 다시 시도하거나 페이지를 새로고침해 주세요."}
      </p>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

