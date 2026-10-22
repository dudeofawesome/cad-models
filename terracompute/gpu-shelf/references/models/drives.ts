import { compound } from "brepjs";
import { block, cutAll } from "./shapes.ts";

// U.2 (2.5", SFF-8639) drives. Origin: corner of the drive, label side up;
// the connector is on the +Y end.

export type U2Drive = { name: string; width: number; length: number; height: number };

export const u2Drives = {
  pm9a3: { name: "Samsung PM9A3", width: 69.85, length: 100.2, height: 7 },
  pm1733: { name: "Samsung PM1733", width: 69.85, length: 100.2, height: 15 },
} satisfies Record<string, U2Drive>;

export const u2CableDepth = 40; // assumed: SFF-8639 plug and bend

export function u2DriveBody(drive: U2Drive) {
  const { width, length, height } = drive;
  // Notch where the SFF-8639 connector sits, recessed into the end face.
  return compound([
    cutAll(block([0, width], [0, length], [0, height]), [
      block([width / 2 - 20, width / 2 + 20], [length - 4, length + 1], [0.5, Math.min(height, 7) - 0.5]),
    ]),
  ]);
}

export function u2DriveKeepouts(drive: U2Drive) {
  return block([0, drive.width], [drive.length, drive.length + u2CableDepth], [0, drive.height]);
}
