import { compound } from "brepjs";
import { block, cutAll, rod } from "./shapes.ts";

// Standard square case fan (140 × 140 × 25, 124.5 hole spacing for 140 mm).
// Origin: front-bottom-left corner of the frame; air flows toward +Y.

export const caseFan = { size: 140, depth: 25, holeSpacing: 124.5, holeDiameter: 4.5 } as const;

export function caseFanBody(size: number = caseFan.size, depth: number = caseFan.depth) {
  const c = size / 2;
  const holeOffset = (caseFan.holeSpacing / caseFan.size) * c;
  const frame = cutAll(block([0, size], [0, depth], [0, size]), [
    rod("y", [c, -1, c], size - 6, depth + 2),
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) =>
        rod("y", [c + sx * holeOffset, -1, c + sz * holeOffset], caseFan.holeDiameter, depth + 2),
      ),
    ),
  ]);
  return compound([frame, rod("y", [c, 2, c], size * 0.3, depth - 4)]);
}
