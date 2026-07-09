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
    <header className="flex flex-none items-center gap-3.5 border-b border-card-border bg-card px-5.5 py-3.5">
      <div className="min-w-0">
        <h1 className="truncate font-head text-[22px] font-extrabold leading-tight tracking-tight">
          {title}
        </h1>
        <p className="mt-0.5 text-[13px] text-[#6f7d72]">{subtitle}</p>
      </div>
      {right && <div className="ml-auto flex flex-none items-center gap-2.5">{right}</div>}
    </header>
  );
}
