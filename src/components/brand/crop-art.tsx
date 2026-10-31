import { cn } from "@/lib/utils";

/**
 * Hand-built vector illustrations for each seed crop. They are bundled with the
 * app (no external image hosts, nothing can break) and are replaced
 * automatically by a real photo when an admin uploads one for the crop.
 */

interface Palette {
  bg: string;
  bg2: string;
}

const PALETTES: Record<string, Palette> = {
  tomato: { bg: "#fde8e4", bg2: "#fbd2c9" },
  cucumber: { bg: "#e5f5dc", bg2: "#cdebbd" },
  potato: { bg: "#f6ecdc", bg2: "#ecdcc0" },
  onion: { bg: "#f6e7ef", bg2: "#ebd2e0" },
  garlic: { bg: "#f2f0e8", bg2: "#e4e0d1" },
  lettuce: { bg: "#e9f7dd", bg2: "#d3efbf" },
  pepper: { bg: "#fdebe0", bg2: "#f9d6c1" },
  mint: { bg: "#dff5ea", bg2: "#c3ead6" },
  zaatar: { bg: "#ecf1e3", bg2: "#d9e3c8" },
  strawberry: { bg: "#fde6ea", bg2: "#f9cdd6" },
  olive: { bg: "#eef1e0", bg2: "#dde3c3" },
  grape: { bg: "#eee8f7", bg2: "#ddd2ef" },
  default: { bg: "#e6f4df", bg2: "#d1ebc4" },
};

function Leaf({ x, y, r = 0, s = 1, fill = "#3f8f3a" }: { x: number; y: number; r?: number; s?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 8 -10, 26 -10, 34 0 C 26 10, 8 10, 0 0 Z" fill={fill} />
      <path d="M2 0 L 30 0" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" />
    </g>
  );
}

function Tomato() {
  return (
    <g>
      <path d="M100 30 C 100 40, 98 46, 96 52" stroke="#3c7a2f" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="78" cy="96" r="34" fill="#e8442e" />
      <circle cx="126" cy="100" r="30" fill="#d93a25" />
      <ellipse cx="66" cy="84" rx="9" ry="6" fill="#ffffff" fillOpacity="0.35" />
      <ellipse cx="116" cy="90" rx="7" ry="5" fill="#ffffff" fillOpacity="0.3" />
      <path d="M78 62 l8 6 l9 -2 l-6 8 l4 8 l-9 -4 l-7 6 l0 -9 l-8 -5 l9 -2 z" fill="#3f8f3a" />
      <path d="M126 70 l7 5 l8 -1 l-5 7 l3 7 l-8 -3 l-6 5 l0 -8 l-7 -4 l8 -2 z" fill="#3f8f3a" />
      <Leaf x={92} y={50} r={-30} s={0.9} />
    </g>
  );
}

function Cucumber() {
  return (
    <g>
      <g transform="rotate(-28 100 92)">
        <rect x="40" y="76" width="120" height="34" rx="17" fill="#3c8a34" />
        <rect x="48" y="80" width="100" height="8" rx="4" fill="#ffffff" fillOpacity="0.18" />
        {[58, 78, 98, 118, 138].map((x) => (
          <circle key={x} cx={x} cy={98} r="1.8" fill="#bfe3a8" />
        ))}
      </g>
      <g transform="rotate(-8 112 112)">
        <rect x="64" y="104" width="100" height="28" rx="14" fill="#2f7a2a" />
        {[80, 100, 120, 140].map((x) => (
          <circle key={x} cx={x} cy={118} r="1.6" fill="#bfe3a8" />
        ))}
      </g>
      <g transform="translate(150 50)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="0" cy="-8" rx="5" ry="8" fill="#f6c63b" transform={`rotate(${r})`} />
        ))}
        <circle r="4" fill="#e59b12" />
      </g>
      <Leaf x={40} y={52} r={-20} s={1.1} />
    </g>
  );
}

function Potato() {
  const eyes = (cx: number, cy: number) =>
    [
      [-10, -4],
      [8, 6],
      [2, -10],
    ].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r="1.8" fill="#8a5a2b" />);
  return (
    <g>
      <path d="M30 128 C 70 118, 130 118, 172 128" stroke="#c9a77a" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="72" cy="100" rx="34" ry="24" fill="#c8955a" transform="rotate(-12 72 100)" />
      <ellipse cx="128" cy="104" rx="30" ry="21" fill="#b98448" transform="rotate(10 128 104)" />
      <ellipse cx="102" cy="76" rx="24" ry="17" fill="#d4a46a" />
      {eyes(72, 100)}
      {eyes(128, 104)}
      {eyes(102, 76)}
      <path d="M100 58 C 98 44, 96 36, 90 28" stroke="#3c7a2f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <Leaf x={92} y={34} r={-150} s={0.8} />
      <Leaf x={94} y={40} r={-30} s={0.8} />
    </g>
  );
}

function Onion() {
  return (
    <g>
      <path d="M96 64 C 92 44, 86 30, 76 18" stroke="#4e9a3d" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M104 64 C 108 44, 116 32, 128 22" stroke="#3f8f3a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M100 62 C 140 66, 150 110, 120 128 C 112 133, 88 133, 80 128 C 50 110, 60 66, 100 62 Z" fill="#a34a7a" />
      <path d="M100 66 C 88 84, 86 112, 94 130" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="3" fill="none" />
      <path d="M100 66 C 116 84, 118 112, 108 130" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="3" fill="none" />
      <path d="M92 132 L 90 140 M100 133 L 100 142 M108 132 L 110 140" stroke="#d9c3a5" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Garlic() {
  return (
    <g>
      <path d="M100 58 C 100 44, 104 32, 112 22" stroke="#9db47a" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M100 56 C 146 62, 152 110, 124 128 C 112 136, 88 136, 76 128 C 48 110, 54 62, 100 56 Z" fill="#f8f5ec" stroke="#e0d8c2" strokeWidth="2" />
      <path d="M100 60 C 84 80, 82 112, 90 132" stroke="#e3dac3" strokeWidth="2.5" fill="none" />
      <path d="M100 60 C 116 80, 118 112, 110 132" stroke="#e3dac3" strokeWidth="2.5" fill="none" />
      <path d="M100 60 C 70 76, 62 106, 76 128" stroke="#e8e0cb" strokeWidth="2" fill="none" />
      <path d="M100 60 C 130 76, 138 106, 124 128" stroke="#e8e0cb" strokeWidth="2" fill="none" />
      <ellipse cx="118" cy="80" rx="6" ry="10" fill="#ffffff" fillOpacity="0.8" />
      <path d="M90 134 L 88 142 M100 135 L 100 144 M110 134 L 112 142" stroke="#cdbf9d" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Lettuce() {
  return (
    <g>
      <ellipse cx="100" cy="132" rx="56" ry="8" fill="#000" fillOpacity="0.06" />
      {[
        [-34, 0, "#7cc551"],
        [34, 0, "#7cc551"],
        [-20, -16, "#5fb043"],
        [20, -16, "#5fb043"],
        [0, -26, "#4a9e38"],
      ].map(([dx, dy, f], i) => (
        <ellipse key={i} cx={100 + Number(dx)} cy={104 + Number(dy)} rx="34" ry="28" fill={String(f)} />
      ))}
      <ellipse cx="100" cy="98" rx="24" ry="20" fill="#9bd86b" />
      <path d="M100 118 L 100 82 M100 104 L 84 90 M100 104 L 116 90" stroke="#e7f7d6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Pepper() {
  return (
    <g>
      <g transform="rotate(-12 78 96)">
        <path d="M78 60 C 104 60, 108 82, 104 104 C 100 128, 88 138, 78 138 C 68 138, 56 128, 52 104 C 48 82, 52 60, 78 60 Z" fill="#e3412b" />
        <path d="M66 74 C 62 90, 62 108, 68 122" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M78 60 C 78 52, 82 46, 88 42" stroke="#3c7a2f" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
      <g transform="rotate(14 130 100)">
        <path d="M130 66 C 152 66, 156 86, 152 106 C 148 126, 138 134, 130 134 C 122 134, 112 126, 108 106 C 104 86, 108 66, 130 66 Z" fill="#4c9a32" />
        <path d="M120 80 C 116 94, 116 110, 122 122" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M130 66 C 130 58, 133 52, 139 48" stroke="#2f6b25" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

function Mint() {
  const pairs = [
    [100, 124, 1.15],
    [100, 98, 1],
    [100, 74, 0.85],
    [100, 54, 0.7],
  ] as const;
  return (
    <g>
      <path d="M100 140 C 100 110, 100 70, 100 34" stroke="#2f7a4a" strokeWidth="4" strokeLinecap="round" fill="none" />
      {pairs.map(([x, y, s], i) => (
        <g key={i}>
          <Leaf x={x} y={y} r={-24} s={s} fill="#3fae6e" />
          <Leaf x={x} y={y} r={-156} s={s} fill="#35a063" />
        </g>
      ))}
      <ellipse cx="100" cy="32" rx="6" ry="9" fill="#55c283" />
    </g>
  );
}

function Zaatar() {
  const sprig = (x: number, tilt: number, key: number) => (
    <g key={key} transform={`rotate(${tilt} ${x} 140)`}>
      <path d={`M${x} 140 L ${x} 44`} stroke="#6b7f4a" strokeWidth="3" strokeLinecap="round" />
      {[52, 66, 80, 94, 108, 122].map((y, i) => (
        <g key={y}>
          <ellipse cx={x - 8} cy={y + (i % 2) * 3} rx="7" ry="4.5" fill="#8fa86a" transform={`rotate(-25 ${x - 8} ${y})`} />
          <ellipse cx={x + 8} cy={y + 2 - (i % 2) * 3} rx="7" ry="4.5" fill="#7d9a59" transform={`rotate(25 ${x + 8} ${y})`} />
        </g>
      ))}
    </g>
  );
  return <g>{[sprig(80, -14, 1), sprig(102, 0, 2), sprig(124, 14, 3)]}</g>;
}

function Strawberry() {
  const seeds = [
    [-12, -6],
    [0, -10],
    [12, -6],
    [-8, 6],
    [6, 6],
    [-2, 18],
  ];
  const berry = (cx: number, cy: number, s: number, key: number) => (
    <g key={key} transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M0 -22 C 30 -26, 36 2, 0 34 C -36 2, -30 -26, 0 -22 Z" fill="#e2384d" />
      {seeds.map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.6" ry="2.4" fill="#ffe08a" />
      ))}
      <path d="M0 -22 l-12 -6 l6 10 l-14 2 l14 4 M0 -22 l12 -6 l-6 10 l14 2 l-14 4" fill="#3f8f3a" stroke="#3f8f3a" strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
  return (
    <g>
      {berry(78, 96, 1.15, 1)}
      {berry(128, 104, 0.95, 2)}
      <Leaf x={120} y={46} r={-40} s={1} />
    </g>
  );
}

function Olive() {
  return (
    <g>
      <path d="M30 120 C 70 100, 120 76, 176 44" stroke="#7a6a4a" strokeWidth="4" strokeLinecap="round" fill="none" />
      {[
        [56, 106, -60],
        [76, 96, 30],
        [98, 84, -70],
        [120, 72, 25],
        [144, 58, -65],
      ].map(([x, y, r], i) => (
        <Leaf key={i} x={x} y={y} r={r} s={1.15} fill={i % 2 ? "#6f8f4f" : "#87a565"} />
      ))}
      <ellipse cx="86" cy="116" rx="9" ry="12" fill="#5b6d2b" />
      <ellipse cx="108" cy="106" rx="9" ry="12" fill="#3d3a4a" />
      <ellipse cx="132" cy="92" rx="8" ry="11" fill="#6a7d32" />
      <ellipse cx="84" cy="112" rx="2.5" ry="4" fill="#fff" fillOpacity="0.3" />
      <ellipse cx="106" cy="102" rx="2.5" ry="4" fill="#fff" fillOpacity="0.25" />
    </g>
  );
}

function Grape() {
  const rows = [
    [0, [-24, -8, 8, 24]],
    [16, [-16, 0, 16]],
    [32, [-8, 8]],
    [48, [0]],
  ] as const;
  return (
    <g>
      <path d="M104 40 C 104 50, 100 56, 100 62" stroke="#7a5a3a" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M108 44 C 124 30, 146 34, 150 50 C 154 66, 136 72, 128 62" stroke="#4e9a3d" strokeWidth="2.5" fill="none" />
      <path d="M100 52 C 76 30, 50 40, 46 58 C 62 56, 70 68, 66 80 C 82 70, 96 72, 100 52 Z" fill="#4e9a3d" />
      {rows.map(([dy, xs]) =>
        xs.map((dx) => (
          <g key={`${dy}-${dx}`}>
            <circle cx={100 + dx} cy={76 + dy} r="10" fill="#6b3f8f" />
            <circle cx={97 + dx} cy={73 + dy} r="3" fill="#ffffff" fillOpacity="0.28" />
          </g>
        )),
      )}
    </g>
  );
}

function Sprout() {
  return (
    <g>
      <path d="M40 128 C 70 120, 130 120, 160 128" stroke="#a88a5f" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M100 124 C 100 100, 100 84, 100 70" stroke="#3c7a2f" strokeWidth="4" strokeLinecap="round" fill="none" />
      <Leaf x={100} y={84} r={-35} s={1.4} />
      <Leaf x={100} y={74} r={-145} s={1.2} fill="#5fb043" />
    </g>
  );
}

const ART: Record<string, () => React.JSX.Element> = {
  tomato: Tomato,
  cucumber: Cucumber,
  potato: Potato,
  onion: Onion,
  garlic: Garlic,
  lettuce: Lettuce,
  pepper: Pepper,
  mint: Mint,
  zaatar: Zaatar,
  strawberry: Strawberry,
  olive: Olive,
  grape: Grape,
};

export function CropArt({ slug, className, title }: { slug: string; className?: string; title?: string }) {
  const Art = ART[slug] ?? Sprout;
  const p = PALETTES[slug] ?? PALETTES.default;
  const gid = `g-${slug}`;
  return (
    <svg
      viewBox="0 0 200 160"
      className={cn("h-full w-full", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={gid} cx="35%" cy="25%" r="90%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="45%" stopColor={p.bg} />
          <stop offset="100%" stopColor={p.bg2} />
        </radialGradient>
      </defs>
      <rect width="200" height="160" fill={`url(#${gid})`} />
      <circle cx="170" cy="22" r="40" fill="#ffffff" fillOpacity="0.35" />
      <circle cx="24" cy="150" r="34" fill="#ffffff" fillOpacity="0.25" />
      <Art />
    </svg>
  );
}
