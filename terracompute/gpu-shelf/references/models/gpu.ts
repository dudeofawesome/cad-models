import { compound } from "brepjs";
import { block, fanRecess } from "./shapes.ts";

// RTX 4090 cards. Card frame, as installed in a tower: length along X with
// the bracket face at X = 0, slot edge at Z = 0 (bottom of the PCIe
// fingers), thickness along +Y from the backplate. Overall L × H × T are
// published; the internal split (backplate, PCB, cooler) and fan layout
// are cosmetic, from product photos.

type Fan = { x: number; diameter: number; side: "front" | "back" };

export type GpuCard = {
  name: string;
  count: number;
  length: number;
  height: number;
  thickness: number;
  fans: Fan[];
};

function threeFans(length: number, diameter: number): Fan[] {
  const pitch = (length - 20) / 3;
  return [0, 1, 2].map((i) => ({ x: 10 + pitch * (i + 0.5), diameter, side: "front" }));
}

export const gpuCards = {
  founders: {
    name: "Nvidia RTX 4090 FE",
    count: 4,
    length: 304,
    height: 137,
    thickness: 61,
    // Flow-through design: one fan on each face, at opposite ends.
    fans: [
      { x: 85, diameter: 110, side: "front" },
      { x: 235, diameter: 110, side: "back" },
    ],
  },
  asusTuf: {
    name: "ASUS TUF RTX 4090 OC",
    count: 1,
    length: 348.2,
    height: 150,
    thickness: 72.6,
    fans: threeFans(348.2, 100),
  },
  gigabyteAero: {
    name: "Gigabyte RTX 4090 Aero OC",
    count: 1,
    length: 342,
    height: 150,
    thickness: 75,
    fans: threeFans(342, 100),
  },
  gigabyteWindforce: {
    name: "Gigabyte RTX 4090 Windforce V2",
    count: 1,
    length: 331,
    height: 136,
    thickness: 55.5,
    fans: threeFans(331, 95),
  },
  msiGamingX: {
    name: "MSI RTX 4090 Gaming X Trio",
    count: 1,
    length: 337,
    height: 140,
    thickness: 77,
    fans: threeFans(337, 95),
  },
} satisfies Record<string, GpuCard>;

export const gpu = {
  // Assumed: PCIe x16 fingers start ~46 from the bracket face, 89 long.
  fingers: { x0: 46, length: 89, height: 8 },
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
  const hubs = [];
  for (const fan of card.fans) {
    const zc = 10 + (H - 10) / 2;
    if (fan.side === "front") {
      const r = fanRecess(shroud, "y", [fan.x, T, zc], -1, fan.diameter, 12);
      shroud = r.body;
      hubs.push(r.hub);
    } else {
      // Back fan sits behind an opening in the backplate.
      const r = fanRecess(back, "y", [fan.x, 0, zc], 1, fan.diameter, backplate);
      back = r.body;
      hubs.push(r.hub);
    }
  }

  return compound([
    block([0, 1], [0, T], bracket.z),
    back,
    block([2, Math.min(L, 260)], pcb.y, [fingers.height, pcb.height]),
    block([fingers.x0, fingers.x0 + fingers.length], pcb.y, [0, fingers.height]),
    shroud,
    ...hubs,
  ]);
}

export function gpuKeepouts(card: GpuCard) {
  return compound([block([0, card.length], [0, card.thickness], [card.height, card.height + gpu.powerKeepout])]);
}
