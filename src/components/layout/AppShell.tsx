import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-28 pt-6 sm:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
