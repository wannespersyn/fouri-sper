import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader title="Menuplanner" subtitle="Weekmenu voor het kamp" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <div className="mx-auto max-w-295">
          <PageSkeleton />
        </div>
      </div>
    </>
  );
}
