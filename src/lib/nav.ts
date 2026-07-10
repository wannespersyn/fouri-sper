import type { ComponentType, SVGProps } from "react";
import {
  MenuplannerIcon,
  ReceptenIcon,
  LeveranciersIcon,
  GroepenIcon,
  ActiviteitenIcon,
  VoorraadIcon,
  BoodschappenIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  kort: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Same order as the design's module list.
export const NAV_ITEMS: NavItem[] = [
  { href: "/menuplanner", label: "Menuplanner", kort: "Menu", Icon: MenuplannerIcon },
  { href: "/recepten", label: "Recepten", kort: "Recept", Icon: ReceptenIcon },
  { href: "/leveranciers", label: "Leveranciers", kort: "Lever.", Icon: LeveranciersIcon },
  { href: "/groepen", label: "Groepen", kort: "Groep", Icon: GroepenIcon },
  { href: "/activiteiten", label: "Activiteiten", kort: "Activ.", Icon: ActiviteitenIcon },
  { href: "/voorraad", label: "Voorraad", kort: "Voorr.", Icon: VoorraadIcon },
  { href: "/boodschappen", label: "Boodschappen", kort: "Bood.", Icon: BoodschappenIcon },
];

// Op mobiel krijgen alleen deze twee een eigen tab in de bottom nav — de rest
// zit achter "Meer" zodat de balk niet overvol raakt op smalle schermen.
export const BOTTOM_NAV_PRIMARY_HREFS = ["/menuplanner", "/boodschappen"];
