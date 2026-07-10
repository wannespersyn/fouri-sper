import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: Readonly<{
  title: string;
  subtitle: string;
  right?: ReactNode;
}>) {
  return (
    <header className="flex flex-none flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-card-border bg-card px-4 py-3 sm:px-5.5 sm:py-3.5">
      <div className="min-w-0">
        <h1 className="truncate font-head text-[19px] font-extrabold leading-tight tracking-tight sm:text-[22px]">
          {title}
        </h1>
        <p className="mt-0.5 text-[13px] text-[#6f7d72]">{subtitle}</p>
      </div>
      {right && <div className="ml-auto flex flex-none items-center gap-2.5">{right}</div>}
    </header>
  );
}
