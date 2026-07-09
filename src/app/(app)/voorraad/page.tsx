import { PageHeader } from "@/components/page-header";
import { getActiefKamp } from "@/lib/data/kamp";
import { getVoorraadOverzicht } from "@/lib/data/voorraad";
import { VoorraadRij } from "@/app/(app)/voorraad/voorraad-rij";

export default async function VoorraadPage() {
  const kamp = await getActiefKamp();
  if (!kamp) return null; // gated by (app)/layout.tsx, shouldn't happen

  const voorraad = await getVoorraadOverzicht(kamp.id);

  return (
    <>
      <PageHeader title="Voorraad" subtitle="Wat is er al in huis" />
      <div className="flex-1 overflow-auto p-5.5">
        <div className="mx-auto max-w-295">
          {voorraad.length === 0 ? (
            <p className="text-sm text-[#6f7d72]">
              Nog geen ingrediënten — die maak je aan via een recept op de Recepten-pagina.
            </p>
          ) : (
            <div className="overflow-hidden rounded-card border border-card-border bg-card">
              {voorraad.map((rij) => (
                <VoorraadRij key={rij.ingredientId} rij={rij} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
