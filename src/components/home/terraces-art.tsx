import { cn } from "@/lib/utils";

/**
 * Decorative vector scene: stone terraces with olive trees, a vegetable bed
 * and a hill village — the hill farming landscape of Palestine. Bundled with
 * the app (no external image host). Purely decorative, hidden from assistive
 * technologies.
 */

function Olive({ x, y, s = 1, sway = false }: { x: number; y: number; s?: number; sway?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C -2 -14, 3 -22, -1 -34 M0 -18 C 6 -24, 9 -27, 12 -34" stroke="#6b5640" strokeWidth="4" fill="none" strokeLinecap="round" />
      <g className={sway ? "plant-sway" : undefined}>
        <ellipse cx="-12" cy="-44" rx="20" ry="13" fill="#7f9a5a" />
        <ellipse cx="12" cy="-48" rx="22" ry="14" fill="#6e8b4c" />
        <ellipse cx="0" cy="-60" rx="18" ry="12" fill="#89a565" />
        <ellipse cx="-4" cy="-50" rx="10" ry="5" fill="#a9c083" opacity="0.7" />
        <circle cx="9" cy="-42" r="2" fill="#3e4b2b" />
        <circle cx="-14" cy="-40" r="2" fill="#3e4b2b" />
        <circle cx="3" cy="-56" r="1.8" fill="#3e4b2b" />
      </g>
    </g>
  );
}

function Seedling({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 V -9" stroke="#3f7d32" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 -8 C -7 -12, -9 -6, -9 -4 C -5 -4, -2 -5, 0 -8 Z" fill="#5aa140" />
      <path d="M0 -9 C 6 -14, 9 -9, 9 -7 C 5 -6, 2 -7, 0 -9 Z" fill="#6cb84d" />
    </g>
  );
}

export function TerracesArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 380" className={cn("h-full w-full", className)} aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ta-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f5df" />
          <stop offset="1" stopColor="#fbf7ea" />
        </linearGradient>
        <linearGradient id="ta-hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9dcb4" />
          <stop offset="1" stopColor="#b7cf9c" />
        </linearGradient>
        <linearGradient id="ta-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c99e6e" />
          <stop offset="1" stopColor="#b3875a" />
        </linearGradient>
      </defs>

      <rect width="600" height="380" fill="url(#ta-sky)" />
      <circle cx="470" cy="78" r="38" fill="#fde7a8" />
      <circle cx="470" cy="78" r="26" fill="#fcd66b" />

      {/* Far hills and village */}
      <path d="M0 170 C 90 120, 170 130, 250 150 C 330 168, 420 110, 600 140 V 260 H 0 Z" fill="url(#ta-hill-far)" />
      <g fill="#efe6d2" stroke="#d7c9a8" strokeWidth="1">
        <rect x="118" y="128" width="22" height="16" rx="1" />
        <rect x="142" y="122" width="18" height="22" rx="1" />
        <rect x="162" y="132" width="20" height="12" rx="1" />
        <path d="M144 122 a 7 7 0 0 1 14 0 z" />
      </g>
      <rect x="149" y="112" width="3" height="10" fill="#d7c9a8" />

      {/* Upper terrace */}
      <path d="M0 210 C 120 190, 260 196, 380 205 C 470 212, 540 200, 600 196 V 260 H 0 Z" fill="#a7c487" />
      <path d="M0 214 C 120 194, 260 200, 380 209 C 470 216, 540 204, 600 200" stroke="#d9cfb6" strokeWidth="6" fill="none" />
      <path d="M0 214 C 120 194, 260 200, 380 209 C 470 216, 540 204, 600 200" stroke="#bfb193" strokeWidth="6" strokeDasharray="10 4" fill="none" opacity="0.6" />
      <Olive x={70} y={212} s={0.8} />
      <Olive x={210} y={203} s={0.75} />
      <Olive x={350} y={208} s={0.8} />
      <Olive x={520} y={204} s={0.7} />

      {/* Middle terrace */}
      <path d="M0 270 C 140 250, 300 258, 430 264 C 510 268, 560 262, 600 258 V 330 H 0 Z" fill="#94b673" />
      <path d="M0 274 C 140 254, 300 262, 430 268 C 510 272, 560 266, 600 262" stroke="#d9cfb6" strokeWidth="8" fill="none" />
      <path d="M0 274 C 140 254, 300 262, 430 268 C 510 272, 560 266, 600 262" stroke="#bfb193" strokeWidth="8" strokeDasharray="14 5" fill="none" opacity="0.55" />
      <Olive x={120} y={270} s={1.05} sway />
      <Olive x={300} y={262} s={1} />
      <Olive x={470} y={268} s={1.1} sway />

      {/* Front vegetable bed */}
      <path d="M0 330 C 160 312, 380 318, 600 314 V 380 H 0 Z" fill="url(#ta-soil)" />
      {[0, 1, 2].map((row) => (
        <path key={row} d={`M${20 + row * 6} ${342 + row * 13} C 200 ${328 + row * 13}, 400 ${333 + row * 13}, 590 ${328 + row * 13}`} stroke="#9c7349" strokeWidth="3" fill="none" opacity="0.55" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <Seedling key={`a${i}`} x={40 + i * 40} y={340 - (i % 3)} />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <Seedling key={`b${i}`} x={60 + i * 41} y={354 - (i % 2)} />
      ))}
      {/* Tomato stakes */}
      {[90, 230, 380, 520].map((x) => (
        <g key={x}>
          <path d={`M${x} 368 V 330`} stroke="#8a6a45" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${x} 360 C ${x - 10} 352, ${x - 10} 342, ${x} 336 C ${x + 10} 342, ${x + 10} 352, ${x} 360`} fill="#4f9a3c" />
          <circle cx={x - 5} cy={350} r="4.5" fill="#e04a2f" />
          <circle cx={x + 5} cy={344} r="4" fill="#ea6a3b" />
        </g>
      ))}
    </svg>
  );
}
