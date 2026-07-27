import type { StreepjeTruiKleur } from "@/lib/streepjes-shared";
import { TruiIcon, TruiBolletjesIcon } from "@/components/icons";

// Kleur/label/icoon/omschrijving per trui-classificatie — gedeeld tussen het
// leaderboard (filterpills + badges per rij) en het profiel (Truien-kaart),
// zodat beide niet uit de pas kunnen lopen.
export const TRUI_INFO: Record<
  StreepjeTruiKleur,
  { label: string; beschrijving: string; bg: string; tekst: string; icon: typeof TruiIcon }
> = {
  geel: { label: "Geel", beschrijving: "algemeen klassement", bg: "#fef3c7", tekst: "#92610a", icon: TruiIcon },
  groen: { label: "Groen", beschrijving: "pintjesklassement", bg: "#dcf3e6", tekst: "#1f6b43", icon: TruiIcon },
  bolletjes: {
    label: "Bolletjes",
    beschrijving: "sterkeklassement",
    bg: "#fee2e2",
    tekst: "#b91c1c",
    icon: TruiBolletjesIcon,
  },
  wit: { label: "Wit", beschrijving: "klassement onder leiding", bg: "#f0ede2", tekst: "#25322b", icon: TruiIcon },
};
