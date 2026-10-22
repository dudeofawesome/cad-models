import { compound } from "brepjs";
import { block, cutAll, drillZ } from "./shapes.ts";

// C-Payne SlimSAS PCIe gen4 device adapter x8/x16 (CP-0200, rev 1.0).
// Frame as measured: component side up, 6-pin power at top left, x16 slot
// along the right edge. Origin at the bottom-left PCB corner, PCB underside.

export const deviceAdapter = {
  width: 40,
  length: 140,
  pcbThickness: 1.6, // assumed
  solderDepth: 2,
  holeDiameter: 3.7,
  holes: [
    [13.9, 105],
    [34.5, 105],
    [13.9, 5.5],
    [34.5, 5.5],
  ],
  slot: { x: [30.5, 37.7], y: [11.6, 100.6], height: 11.5, centerX: 34.1 },
  // SlimSAS and 6-pin positions estimated from the photo. SlimSAS plugs
  // insert toward −Y, so their openings face +Y.
  slimsas: [
    { x: [2, 25], y: [45.6, 59] },
    { x: [2, 25], y: [82, 95] },
  ],
  slimsasHeight: 8.3,
  power: { x: [0.5, 11.4], y: [122, 137] },
  powerHeight: 12,
  // All three cables run toward +Y over the board and leave past the top
  // edge; the lower SlimSAS cable lies over the upper connector.
  cableHeight: 16, // assumed: connector plus one cable thickness
  cableBend: 30, // 1" SlimSAS bend radius plus margin
} as const;

export function deviceAdapterBody() {
  const a = deviceAdapter;
  const top = a.pcbThickness;
  const pcb = drillZ(block([0, a.width], [0, a.length], [0, top]), a.holes, a.holeDiameter, [0, top]);
  const slot = cutAll(block(a.slot.x, a.slot.y, [top, top + a.slot.height]), [
    // Card-edge opening.
    block([a.slot.centerX - 0.9, a.slot.centerX + 0.9], [a.slot.y[0] + 2, a.slot.y[1] - 2], [top + 3, top + a.slot.height + 1]),
  ]);
  const slimsas = a.slimsas.map(({ x, y }) =>
    cutAll(block(x, y, [top, top + a.slimsasHeight]), [
      block([x[0] + 2, x[1] - 2], [y[1] - 6, y[1] + 1], [top + 2, top + a.slimsasHeight - 2]),
    ]),
  );
  const power = cutAll(block(a.power.x, a.power.y, [top, top + a.powerHeight]), [
    block([a.power.x[0] + 1.5, a.power.x[1] - 1.5], [a.power.y[0] + 1.5, a.power.y[1] - 1.5], [top + 4, top + a.powerHeight + 1]),
  ]);
  return compound([
    pcb,
    // 6-pin solder joints on the underside.
    block(a.power.x, a.power.y, [-a.solderDepth, 0]),
    slot,
    // x16 key, ~12 from the slot's top end.
    block([a.slot.centerX - 0.9, a.slot.centerX + 0.9], [a.slot.y[1] - 14, a.slot.y[1] - 12], [top + 3, top + a.slot.height]),
    ...slimsas,
    power,
  ]);
}

export function deviceAdapterKeepouts() {
  const a = deviceAdapter;
  const top = a.pcbThickness;
  return compound([
    // Cable run over the board, from the lower SlimSAS plug to the top edge.
    block([0, 25], [a.slimsas[0].y[1], a.length], [top + a.slimsasHeight, top + a.cableHeight]),
    // Cables leaving the top edge before they can bend.
    block([0, 25], [a.length, a.length + a.cableBend], [top, top + a.cableHeight]),
  ]);
}
