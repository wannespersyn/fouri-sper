import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader title="Leaderboard" subtitle="All-time & per dag klassement" />
      <div className="p-3.5 sm:p-5.5">
        <PageSkeleton />
      </div>
    </>
  );
}
