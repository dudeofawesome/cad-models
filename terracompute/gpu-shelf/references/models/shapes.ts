import { box, cut, cylinder, unwrap } from "brepjs";

// Shared building blocks for the reference models. Units: mm, Z up.

export type Range = readonly [number, number];
type Tool = Parameters<typeof cut>[1];

/** Axis-aligned box spanning the given extents. */
export function block([x0, x1]: Range, [y0, y1]: Range, [z0, z1]: Range) {
  return box(x1 - x0, y1 - y0, z1 - z0, {
    at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  });
}

export function cutAll(shape: ReturnType<typeof block>, tools: Tool[]) {
  let result = shape;
  for (const tool of tools) result = unwrap(cut(result, tool));
  return result;
}

/** Vertical through-holes in a flat plate spanning Z range `z`. */
export function drillZ(
  plate: ReturnType<typeof block>,
  holes: ReadonlyArray<readonly [number, number]>,
  diameter: number,
  [z0, z1]: Range,
) {
  // Tools poke past both faces so each hole goes through.
  return cutAll(
    plate,
    holes.map(([x, y]) => cylinder(diameter / 2, z1 - z0 + 2, { at: [x, y, z0 - 1] })),
  );
}

type Axis = "x" | "y" | "z";
const axes: Record<Axis, [number, number, number]> = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};

/** Cylinder along an axis, from `base` running `length` in the axis's direction (negative runs backward). */
export function rod(
  axis: Axis,
  base: [number, number, number],
  diameter: number,
  length: number,
) {
  const dir = axes[axis].map((c) => c * Math.sign(length)) as [number, number, number];
  return cylinder(diameter / 2, Math.abs(length), { at: base, axis: dir });
}

/**
 * Round fan opening cut into a face, with a hub left in the middle, so a
 * fan reads as a fan. `face` is the point at the fan's center on the
 * surface; `inward` is the axis direction pointing into the body.
 */
export function fanRecess(
  body: ReturnType<typeof block>,
  axis: Axis,
  face: [number, number, number],
  inward: 1 | -1,
  diameter: number,
  depth: number,
) {
  const pocket = rod(axis, offset(face, axis, -inward), diameter, inward * (depth + 1));
  const hub = rod(axis, offset(face, axis, inward * depth), diameter * 0.35, -inward * (depth - 1));
  return { body: cutAll(body, [pocket]), hub };
}

function offset(p: [number, number, number], axis: Axis, d: number): [number, number, number] {
  const a = axes[axis];
  return [p[0] + a[0] * d, p[1] + a[1] * d, p[2] + a[2] * d];
}

/** Evenly spaced thin plates (heatsink fins) along an axis. */
export function fins(
  axis: "x" | "y",
  [a0, a1]: Range,
  across: Range,
  [z0, z1]: Range,
  pitch: number,
  thickness: number,
) {
  const count = Math.floor((a1 - a0 - thickness) / pitch) + 1;
  return Array.from({ length: count }, (_, i) => {
    const a = a0 + i * pitch;
    const along: Range = [a, a + thickness];
    return axis === "x" ? block(along, across, [z0, z1]) : block(across, along, [z0, z1]);
  });
}
