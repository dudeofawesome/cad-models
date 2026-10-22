import { compound } from "brepjs";
import { block, cutAll, fanRecess } from "./shapes.ts";

// RTX 4090 cards. Card frame, as installed in a tower: length along X with
// the bracket face at X = 0, slot edge at Z = 0 (bottom of the PCIe
// fingers), thickness along +Y from the backplate, fans on the +Y face.
// Overall L × H × T are published. Fan centers and diameters, and where the
// edge fingers start, are measured from each maker's straight-on product
// photo, scaled by the published length (±3). The internal split
// (backplate, PCB, cooler) is cosmetic.

type Fan = {
  x: number; // center, from the bracket face
  z: number; // center, above the slot edge
  diameter: number; // fan opening in the shroud
  side: "front" | "back"; // front: cooler (+Y) face; back: backplate face
};

export type GpuCard = {
  name: string;
  count: number;
  length: number;
  height: number;
  thickness: number;
  fingersX0: number; // where the PCIe edge fingers start, from the bracket face
  fans: Fan[];
  /** Backplate opening where air passes straight through the cooler, if any. */
  passThrough?: { x: readonly [number, number]; z: readonly [number, number] };
  /** Which way the 16-pin power plug points. */
  powerPlug: "up" | "sideways";
};

const front = (x: number, z: number, diameter: number): Fan => ({ x, z, diameter, side: "front" });

export const gpuCards = {
  founders: {
    name: "Nvidia RTX 4090 FE",
    count: 4,
    length: 304,
    height: 137,
    thickness: 61,
    fingersX0: 48,
    // Flow-through: the bracket-end fan blows out the bracket and edges; the
    // tail fan sits on the backplate face and pulls air through the cooler.
    // The tail fan's position is estimated from the tail section's outline.
    fans: [front(55, 71, 110), { x: 255, z: 71, diameter: 100, side: "back" }],
    powerPlug: "up",
  },
  asusTuf: {
    name: "ASUS TUF RTX 4090 OC",
    count: 1,
    length: 348.2,
    height: 150,
    thickness: 72.6,
    fingersX0: 55,
    fans: [front(59.6, 77, 108), front(174.4, 77, 108), front(288.9, 76, 108)],
    passThrough: { x: [240, 343], z: [25, 128] },
    powerPlug: "up",
  },
  gigabyteAero: {
    name: "Gigabyte RTX 4090 Aero OC",
    count: 1,
    length: 342,
    height: 150,
    thickness: 75,
    fingersX0: 57,
    // Pass-through not confirmed for this card.
    fans: [front(59.2, 76.5, 110), front(170.8, 76, 110), front(283, 76.5, 112)],
    powerPlug: "up",
  },
  gigabyteWindforce: {
    name: "Gigabyte RTX 4090 Windforce V2",
    count: 1,
    length: 331,
    height: 136,
    thickness: 55.5,
    fingersX0: 52,
    fans: [front(56.2, 71, 104), front(164.8, 70, 104), front(274.1, 71, 104)],
    passThrough: { x: [225, 326], z: [22, 120] },
    // Points along the card into a notch cut in the cooler's top corner.
    powerPlug: "sideways",
  },
  msiGamingX: {
    name: "MSI RTX 4090 Gaming X Trio",
    count: 1,
    length: 337,
    height: 140,
    thickness: 77,
    fingersX0: 45.5,
    fans: [front(55.6, 72, 102), front(167, 72, 102), front(279, 72, 102)],
    passThrough: { x: [230, 332], z: [22, 122] },
    powerPlug: "up",
  },
} satisfies Record<string, GpuCard>;

export const gpu = {
  // x16 edge fingers measure 77–84 long across the photos; ~81 assumed.
  fingers: { length: 81, height: 8 },
  pcb: { y: [4, 5.6], height: 111 },
  backplate: 3.5,
  // PCIe bracket: 1 thick, from a tab below the slot edge up to 111.5.
  bracket: { z: [-8.5, 111.5] },
  // 16-pin plug (~20) plus 35 straight run before the cable may bend.
  // Applied along the whole top edge because plug positions differ by card.
  powerKeepout: 55,
} as const;

export function gpuBody(card: GpuCard) {
  const { fingers, pcb, backplate, bracket } = gpu;
  const L = card.length;
  const T = card.thickness;
  const H = card.height;
  const shroudY0 = pcb.y[1];

  let shroud = block([2, L], [shroudY0, T], [10, H]);
  let back = block([2, L], [0, backplate], [10, H]);
  if (card.passThrough) {
    // Through the backplate, where air leaves the cooler.
    back = cutAll(back, [block(card.passThrough.x, [-1, backplate + 1], card.passThrough.z)]);
  }
  const hubs = [];
  for (const fan of card.fans) {
    if (fan.side === "front") {
      const r = fanRecess(shroud, "y", [fan.x, T, fan.z], -1, fan.diameter, 12);
      shroud = r.body;
      hubs.push(r.hub);
    } else {
      // Back fan sits behind an opening in the backplate.
      const r = fanRecess(back, "y", [fan.x, 0, fan.z], 1, fan.diameter, backplate);
      back = r.body;
      hubs.push(r.hub);
    }
  }
  // Partner-card PCBs end before the pass-through section.
  const pcbEnd = card.passThrough ? card.passThrough.x[0] : Math.min(L, 260);

  return compound([
    block([0, 1], [0, T], bracket.z),
    back,
    block([2, pcbEnd], pcb.y, [fingers.height, pcb.height]),
    block([card.fingersX0, card.fingersX0 + fingers.length], pcb.y, [0, fingers.height]),
    shroud,
    ...hubs,
  ]);
}

export function gpuKeepouts(card: GpuCard) {
  return compound([block([0, card.length], [0, card.thickness], [card.height, card.height + gpu.powerKeepout])]);
}
