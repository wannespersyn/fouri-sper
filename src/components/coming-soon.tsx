export function ComingSoon({ module }: { module: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-card-border bg-card p-10 text-center">
      <p className="font-head text-lg font-bold">{module} komt eraan</p>
      <p className="max-w-sm text-sm text-[#6f7d72]">
        Deze module wordt in een volgende stap gebouwd, zodra we ze samen kunnen
        overlopen.
      </p>
    </div>
  );
}
