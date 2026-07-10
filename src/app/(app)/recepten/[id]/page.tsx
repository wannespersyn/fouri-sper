import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import {
  getIngredientenOpties,
  getLeverancierOpties,
  getReceptDetail,
  getTotaalBasisAantal,
} from "@/lib/data/recepten";
import { ReceptDetailClient } from "@/app/(app)/recepten/[id]/recept-detail-client";
import { categorieLabel } from "@/lib/recepten-shared";

export default async function ReceptDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const [recept, ingredientOpties, leverancierOpties, standaardEters] = await Promise.all([
    getReceptDetail(kamp.id, id),
    getIngredientenOpties(kamp.id),
    getLeverancierOpties(kamp.id),
    getTotaalBasisAantal(kamp.id),
  ]);

  if (!recept) {
    return (
      <>
        <PageHeader title="Recept" subtitle="Bewerk ingrediënten & diëten" />
        <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
          <div className="mx-auto max-w-205 rounded-[22px] border border-card-border bg-card p-5 text-sm text-[#6f7d72]">
            Dit recept is niet gevonden.{" "}
            <Link href="/recepten" className="font-extrabold text-[#2f6d4f]">
              Terug naar overzicht
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={recept.naam} subtitle={`${categorieLabel(recept.categorie)} · bewerk ingrediënten & diëten`} />
      <div className="flex-1 overflow-auto p-3.5 sm:p-5.5">
        <ReceptDetailClient
          recept={recept}
          ingredientOpties={ingredientOpties}
          leverancierOpties={leverancierOpties}
          standaardEters={standaardEters || 100}
        />
      </div>
    </>
  );
}
