import type { SVGProps } from "react";

// Line icons ported 1:1 from the Claude Design reference (its `icon()` helper).

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={19}
      height={19}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function MenuplannerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x={3} y={4} width={18} height={16} rx={2} />
      <path d="M3 9h18M9 4v16" />
    </Svg>
  );
}

export function ReceptenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" />
      <path d="M8 8h7M8 12h7" />
    </Svg>
  );
}

export function LeveranciersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 8h13v9H3zM16 11h3l2 3v3h-5z" />
      <circle cx={7} cy={18} r={1.6} />
      <circle cx={17.5} cy={18} r={1.6} />
    </Svg>
  );
}

export function GroepenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx={9} cy={8} r={3} />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" />
    </Svg>
  );
}

export function ActiviteitenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5L12 15.5 7 18.2l1-5.5-4-3.9 5.5-.8z" />
    </Svg>
  );
}

export function VoorraadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 7l9-4 9 4-9 4z" />
      <path d="M3 7v10l9 4 9-4V7M12 11v10" />
    </Svg>
  );
}

export function BoodschappenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 6h16l-1.5 11H5.5zM9 6V4h6v2" />
      <path d="M9 21a1 1 0 1 0 0-.01M17 21a1 1 0 1 0 0-.01" />
    </Svg>
  );
}

export function StreepjesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M6 8h9v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
      <path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
      <path d="M6 8l1-4h7l1 4" />
    </Svg>
  );
}

export function BierIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
      <path d="M9 12v6" />
      <path d="M13 12v6" />
      <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z" />
      <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
    </Svg>
  );
}

export function SterkeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 12 4.207 4.207A.707.707 0 0 1 4.707 3h14.586a.707.707 0 0 1 .5 1.207z" />
      <path d="M12 12v10" />
      <path d="M7 22h10" />
    </Svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </Svg>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 17l-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
    </Svg>
  );
}

export function MeerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x={4} y={4} width={7} height={7} rx={1.5} />
      <rect x={13} y={4} width={7} height={7} rx={1.5} />
      <rect x={4} y={13} width={7} height={7} rx={1.5} />
      <rect x={13} y={13} width={7} height={7} rx={1.5} />
    </Svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  );
}

export function LedenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx={12} cy={8} r={3.5} />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      <path d="M20 8.5a3 3 0 0 1 2 5.4M4 8.5a3 3 0 0 0-2 5.4" />
    </Svg>
  );
}

export function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 5H5a3 3 0 0 0 3 4M16 5h3a3 3 0 0 1-3 4" />
      <path d="M12 13v3M9 20h6M9.5 20a2.5 2.5 0 0 1 5 0" />
    </Svg>
  );
}
