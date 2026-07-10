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

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  );
}
