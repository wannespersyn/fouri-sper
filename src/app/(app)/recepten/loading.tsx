import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader title="Recepten" subtitle="Alle gerechten en hun status" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <div className="mx-auto max-w-310">
          <PageSkeleton />
        </div>
      </div>
    </>
  );
}
