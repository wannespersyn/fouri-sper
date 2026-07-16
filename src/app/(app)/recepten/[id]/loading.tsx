import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader title="Recept" subtitle="Bewerk ingrediënten & diëten" />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <PageSkeleton />
      </div>
    </>
  );
}
