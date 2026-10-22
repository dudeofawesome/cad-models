import { compound } from "brepjs";
import { block, cutAll, drillZ, fanRecess, fins, rod, type Range } from "./shapes.ts";

// ASRock Rack ROME2D32GM-2T with two Dynatron A39 coolers and 32 DIMMs.
// Origin: front-left corner of the PCB underside. The rear-I/O (Ethernet)
// edge lies along Y = 0; X runs left to right seen from that edge.
// Feature positions come from the manual's layout drawing, cross-checked
// against the overhead photo; see dimensions.md.

export const motherboard = {
  width: 420,
  depth: 351,
  pcbThickness: 1.6, // assumed, typical server board
  holeDiameter: 4, // assumed; the holes are keyhole slots
  holes: [
    [9.3, 19.3],
    [174.4, 19.2],
    [411.7, 9.1],
    [8.1, 140],
    [411.9, 140],
    [208.6, 122],
    [8.1, 343.5],
    [411.9, 343.5],
  ],
  thumbscrew: [223.2, 341.9],
  sockets: [
    [104.5, 214.5],
    [314, 214.5],
  ],
  // Four banks of 8 DIMM slots, running front to back.
  dimmBanks: [
    [3, 62],
    [147, 203],
    [214, 271],
    [357, 415],
  ],
  dimmY: [147, 306],
  dimm: { length: 133.35, height: 31.25, thickness: 4, seat: 3 },
  vrmHeatsinks: [
    { x: [73, 146], y: [109, 123] },
    { x: [269, 344], y: [109, 123] },
  ],
  lanHeatsink: { x: [186, 239], y: [33, 73] },
  heatsinkHeight: 22, // assumed, from photos
  // Rear I/O, left to right; Y < 0 is how far each sticks past the edge.
  io: [
    { name: "USB 3.2 ×2", x: [52, 66], y: [-3, 17], height: 15.6 },
    { name: "USB 3.2 ×2", x: [72, 86], y: [-3, 17], height: 15.6 },
    { name: "VGA", x: [92, 122], y: [-6, 12], height: 12.5 },
    { name: "UID button", x: [126, 133], y: [-2, 6], height: 6 },
    { name: "power button", x: [136, 144], y: [-2, 6], height: 6 },
    { name: "reset button", x: [149, 156], y: [-2, 6], height: 6 },
    { name: "NMI button", x: [159, 165], y: [-2, 6], height: 6 },
    { name: "RJ45", x: [181, 197], y: [-3, 21], height: 13.5 },
    { name: "RJ45", x: [201, 217], y: [-3, 21], height: 13.5 },
    { name: "RJ45", x: [221, 237], y: [-3, 21], height: 13.5 },
  ],
  ioCableDepth: 60, // assumed: room for plugged Ethernet and USB cables
  // SlimSAS connector positions are measured from a photo with each
  // connector highlighted by the user (2026-10-21), mapped to board
  // coordinates through the mounting holes (±3).
  // Side-entry SlimSAS along the back edge; cables plug in from behind.
  // Names, left to right, from the manual's layout drawing.
  slimsasEdgeNames: ["SLIM7_1", "SLIM7_2", "SLIM6_1", "SLIM6_2", "SLIM2_1", "SLIM2_2", "SLIM1_1", "SLIM1_2"],
  slimsasEdge: [
    [77.5, 102.4],
    [107.3, 132],
    [133.7, 158.4],
    [163.3, 187.7],
    [302.3, 326],
    [331, 355.1],
    [356.6, 380.5],
    [386, 409.3],
  ],
  slimsasEdgeY: [333, 351],
  slimsasEdgeHeight: 9, // assumed
  slimsasCableDepth: 50, // behind the back edge: plug plus 1" bend radius
  slimsasCableHeight: 25,
  // Vertical-entry SlimSAS; cables plug in from above. Names, in list
  // order, from the manual's layout drawing.
  slimsasVerticalNames: [
    "SLIM9_1", "SLIM9_2", "SLIM8_1", "SLIM8_2",
    "SLIM4_1", "SLIM4_2", "SLIM3_1", "SLIM3_2",
    "SLIM10_1", "SLIM10_2", "SLIM5_1",
  ],
  slimsasVertical: [
    { x: [14.8, 26.5], y: [313, 342] },
    { x: [27.8, 39.5], y: [313, 342] },
    { x: [43.6, 55.1], y: [313, 342] },
    { x: [56.5, 68], y: [313, 342] },
    { x: [239.9, 250.8], y: [313, 341] },
    { x: [252.9, 263.7], y: [313, 341] },
    { x: [272.5, 283.3], y: [313, 341] },
    { x: [284.6, 295.3], y: [313, 341] },
    { x: [52.6, 64.2], y: [80, 110] },
    { x: [67, 79.1], y: [79, 108] },
    { x: [340.9, 352], y: [81, 109] },
  ],
  slimsasVerticalHeight: 10, // assumed
  slimsasVerticalCable: 30, // assumed: plug plus bend above the connector
  // ATX power: 24-pin + 8-pin on the left edge, 8-pin on the right edge.
  // Cables plug in from above.
  power: [
    { x: [3, 13], y: [36, 88] },
    { x: [3, 13], y: [91, 108] },
    { x: [407, 417], y: [91, 109] },
  ],
  powerHeight: 13,
  powerCableHeight: 60, // assumed: plug plus cable bend
} as const;

// Dynatron A39: fin stack 120 (X) × 82 (Y); the 80 mm fan sits on the
// I/O-facing (−Y) side. Air flows along Y through the fins.
export const cooler = {
  heatsink: { width: 120, depth: 82 },
  fan: { size: 80, depth: 38 },
  height: 115, // above the PCB top, assumed (110 cooler on the socket)
} as const;

function coolerModel(cx: number, cy: number, z0: number) {
  const { heatsink, fan, height } = cooler;
  const top = z0 + height;
  const plateTop = top - 3; // heat-pipe tips stand 3 above the top plate
  const hx: Range = [cx - heatsink.width / 2, cx + heatsink.width / 2];
  const hy: Range = [cy - heatsink.depth / 2, cy + heatsink.depth / 2];
  const finBottom = z0 + 30;

  const fanY0 = hy[0] - fan.depth;
  const fanZ: Range = [plateTop - fan.size, plateTop];
  const fanFrame = fanRecess(
    block([cx - fan.size / 2, cx + fan.size / 2], [fanY0, hy[0]], fanZ),
    "y",
    [cx, fanY0, (fanZ[0] + fanZ[1]) / 2],
    1,
    fan.size - 4,
    fan.depth - 4,
  );

  return compound([
    // SP3 socket frame and the cooler's contact base.
    block([cx - 38, cx + 38], [cy - 58.5, cy + 58.5], [z0, z0 + 6]),
    block([cx - 35, cx + 35], [cy - 35, cy + 35], [z0 + 6, finBottom]),
    ...fins("x", hx, hy, [finBottom, plateTop - 1], 2.5, 0.5),
    block(hx, hy, [plateTop - 1, plateTop]),
    // Two rows of four heat pipes, tips showing above the top plate.
    ...[-35, 35].flatMap((dx) =>
      [-27, -9, 9, 27].map((dy) => rod("z", [cx + dx, cy + dy, z0 + 10], 6, top - z0 - 10)),
    ),
    fanFrame.body,
    fanFrame.hub,
  ]);
}

function finnedHeatsink(x: Range, y: Range, z0: number, height: number) {
  return [block(x, y, [z0, z0 + 4]), ...fins("x", x, y, [z0 + 4, z0 + height], 3, 1)];
}

export function motherboardBody() {
  const m = motherboard;
  const top = m.pcbThickness;
  const pcb = drillZ(
    block([0, m.width], [0, m.depth], [0, top]),
    [...m.holes, m.thumbscrew],
    m.holeDiameter,
    [0, top],
  );

  const dimms = m.dimmBanks.flatMap(([x0, x1]) => {
    const pitch = (x1 - x0) / 8;
    const yMid = (m.dimmY[0] + m.dimmY[1]) / 2;
    return Array.from({ length: 8 }, (_, i) => {
      const x = x0 + pitch * (i + 0.5);
      const { length, height, thickness, seat } = m.dimm;
      return [
        block([x - 3, x + 3], m.dimmY, [top, top + 7]),
        block(
          [x - thickness / 2, x + thickness / 2],
          [yMid - length / 2, yMid + length / 2],
          [top + seat, top + seat + height],
        ),
      ];
    }).flat();
  });

  const verticalSlimsas = m.slimsasVertical.map(({ x, y }) =>
    cutAll(block(x, y, [top, top + m.slimsasVerticalHeight]), [
      block([x[0] + 2, x[1] - 2], [y[0] + 2, y[1] - 2], [top + 3, top + m.slimsasVerticalHeight + 1]),
    ]),
  );
  const edgeSlimsas = m.slimsasEdge.map((x) =>
    cutAll(block(x, m.slimsasEdgeY, [top, top + m.slimsasEdgeHeight]), [
      block([x[0] + 2, x[1] - 2], [m.slimsasEdgeY[1] - 8, m.slimsasEdgeY[1] + 1], [top + 2, top + m.slimsasEdgeHeight - 2]),
    ]),
  );

  return compound([
    pcb,
    ...dimms,
    ...m.sockets.map(([x, y]) => coolerModel(x, y, top)),
    ...m.vrmHeatsinks.flatMap(({ x, y }) => finnedHeatsink(x, y, top, m.heatsinkHeight)),
    ...finnedHeatsink(m.lanHeatsink.x, m.lanHeatsink.y, top, m.heatsinkHeight),
    ...m.io.map(({ x, y, height }) => block(x, y, [top, top + height])),
    ...edgeSlimsas,
    ...verticalSlimsas,
    ...m.power.map(({ x, y }) => block(x, y, [top, top + m.powerHeight])),
    rod("z", [m.thumbscrew[0], m.thumbscrew[1], top], 8, 12),
  ]);
}

export function motherboardKeepouts() {
  const m = motherboard;
  const top = m.pcbThickness;
  const ioX: Range = [m.io[0].x[0], m.io[m.io.length - 1].x[1]];
  return compound([
    block(ioX, [-m.ioCableDepth, -6], [top, top + 16]),
    ...m.slimsasEdge.map((x) =>
      block(x, [m.depth, m.depth + m.slimsasCableDepth], [top, top + m.slimsasCableHeight]),
    ),
    ...m.slimsasVertical.map(({ x, y }) =>
      block(x, y, [top + m.slimsasVerticalHeight, top + m.slimsasVerticalHeight + m.slimsasVerticalCable]),
    ),
    ...m.power.map(({ x, y }) => block(x, y, [top + m.powerHeight, top + m.powerCableHeight])),
  ]);
}
