import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export default function BoodschappenPage() {
  return (
    <>
      <PageHeader title="Boodschappen" subtitle="Dagelijks besteloverzicht" />
      <div className="flex-1 overflow-auto p-5.5">
        <div className="mx-auto max-w-295">
          <ComingSoon module="De boodschappenlijst" />
        </div>
      </div>
    </>
  );
}
