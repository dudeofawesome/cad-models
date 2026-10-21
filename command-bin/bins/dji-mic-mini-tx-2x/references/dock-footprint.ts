import { readFile } from "node:fs/promises";
import { draw } from "brepjs";
import type { Point2D } from "brepjs";

// Fusion's bottom sketch: mm, nominal bounds X=0..32.3, Y=-22.75..0.
// Keep its orientation; which end contains the USB port is still unconfirmed.
export const dockFootprintSize = { width: 32.3, depth: 22.75 };
const source = await readFile(new URL("./bottom.dxf", import.meta.url), "utf8");
const lines = source.trim().split(/\r?\n/).map((line) => line.trim());
type Group = { code: number; value: string };
const groups: Group[] = [];
for (let i = 0; i < lines.length; i += 2) {
  groups.push({ code: Number(lines[i]), value: lines[i + 1] });
}
const units = groups.findIndex((g) => g.code === 9 && g.value === "$INSUNITS");
if (groups[units + 1]?.value !== "4") {
  throw new Error("bottom.dxf must declare millimeters ($INSUNITS=4)");
}

// Read only the outline splines. POINTs and DASHED LINEs are construction
// geometry in this sketch. Reject other outline types rather than omit them.
const curves: Point2D[][] = [];
let inEntities = false;
for (let i = 0; i < groups.length; i += 1) {
  const group = groups[i];
  if (group.code === 2 && group.value === "ENTITIES") inEntities = true;
  if (!inEntities || group.code !== 0) continue;
  if (group.value === "ENDSEC") break;
  let end = i + 1;
  while (end < groups.length && groups[end].code !== 0) end += 1;
  const entity = groups.slice(i + 1, end);
  const values = (code: number) =>
    entity.filter((g) => g.code === code).map((g) => Number(g.value));
  if (group.value === "POINT") continue;
  if (
    group.value === "LINE" &&
    entity.some((g) => g.code === 6 && g.value === "DASHED")
  ) continue;
  if (group.value !== "SPLINE") {
    throw new Error(`Unsupported dock outline entity: ${group.value}`);
  }

  const degree = values(71)[0];
  const knots = values(40);
  const xs = values(10);
  const ys = values(20);
  let poles: Point2D[] = xs.map((x, index) => [x, ys[index]]);
  if (
    degree !== 5 ||
    knots.length !== poles.length + degree + 1 ||
    ys.length !== xs.length ||
    values(30).some((z) => z !== 0) ||
    values(41).some((weight) => weight !== 1) ||
    knots.slice(0, degree + 1).some((k) => k !== knots[0]) ||
    knots.slice(-degree - 1).some((k) => k !== knots.at(-1))
  ) {
    throw new Error("Expected planar, non-rational, clamped degree-5 dock splines");
  }

  // Exact B-spline -> Bezier conversion: insert each internal knot until
  // its multiplicity equals the degree. No sampled/polyline approximation.
  const internal = [...new Set(knots.slice(degree + 1, -degree - 1))];
  for (const knot of internal) {
    let count = knots.filter((k) => k === knot).length;
    while (count < degree) {
      const span = knots.findIndex((k) => k > knot) - 1;
      const next: Point2D[] = new Array(poles.length + 1);
      for (let j = 0; j <= span - degree; j += 1) next[j] = poles[j];
      for (let j = span - count; j < poles.length; j += 1) {
        next[j + 1] = poles[j];
      }
      for (let j = span - degree + 1; j <= span - count; j += 1) {
        const alpha = (knot - knots[j]) / (knots[j + degree] - knots[j]);
        next[j] = [
          (1 - alpha) * poles[j - 1][0] + alpha * poles[j][0],
          (1 - alpha) * poles[j - 1][1] + alpha * poles[j][1],
        ];
      }
      poles = next;
      knots.splice(span + 1, 0, knot);
      count += 1;
    }
  }
  for (let j = degree; j < poles.length; j += 1) {
    if (knots[j] < knots[j + 1]) curves.push(poles.slice(j - degree, j + 1));
  }
}
if (curves.length !== 40) {
  throw new Error("Expected four ten-span outline splines in bottom.dxf");
}

export function dockFootprint() {
  const remaining = curves.map((curve) => [...curve]);
  // Counterclockwise traversal keeps offsets on a consistent side of every
  // span. Drawing.offset uses negative distances to expand this contour.
  const first = remaining.shift()!.reverse();
  const start = first[0];
  const pen = draw(start);
  const append = (curve: Point2D[]) =>
    pen.bezierCurveTo(curve.at(-1)!, curve.slice(1, -1));
  append(first);
  const near = (a: Point2D, b: Point2D) =>
    Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-7;
  while (remaining.length) {
    const index = remaining.findIndex((curve) =>
      near(curve[0], pen.penPosition) || near(curve.at(-1)!, pen.penPosition),
    );
    if (index < 0) throw new Error("Disconnected dock outline in bottom.dxf");
    const curve = remaining.splice(index, 1)[0];
    if (!near(curve[0], pen.penPosition)) curve.reverse();
    append(curve);
  }
  if (!near(pen.penPosition, start)) throw new Error("Dock outline is not closed");
  return pen.done().translate(
    -dockFootprintSize.width / 2,
    dockFootprintSize.depth / 2,
  );
}
