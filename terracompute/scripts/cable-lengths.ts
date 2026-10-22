// Print the estimated SlimSAS cable routes for each layout option, both
// with the best connector choice and with the GPUs cabled as they are today.
// Run: node scripts/cable-lengths.ts (from terracompute/)
import { cable, currentWiring, planCables } from "../gpu-shelf/layout/cables.ts";
import { gpuTier } from "../gpu-shelf/layout/placement.ts";
import { stackedTiersCables, threePerTierCables, twoRowsCables } from "../gpu-shelf/layout/options.ts";

const options = [
  { name: "A, stacked tiers", rows: stackedTiersCables(), motherboardZ: 0 },
  { name: "B, two rows", rows: twoRowsCables(), motherboardZ: 0 },
  // Option C's motherboard tier sits on top of one GPU tier.
  { name: "C, three cards per tier", rows: threePerTierCables(), motherboardZ: gpuTier.height },
];

for (const { name, rows, motherboardZ } of options) {
  for (const [wiring, allowed] of [
    ["best connector pairs", undefined],
    ["as cabled today", currentWiring],
  ] as const) {
    const plan = planCables(rows, motherboardZ, allowed);
    const verdict = plan.longest <= plan.maxRoute ? "reaches" : "TOO SHORT";
    console.log(
      `\nOption ${name}, ${wiring}: longest route ${plan.longest.toFixed(0)} mm of ${plan.maxRoute.toFixed(0)} mm allowed (${verdict})`,
    );
    for (const a of plan.assignments) {
      const spare = cable.length - 2 * cable.plug - Math.max(...a.routes) * (1 + cable.routingAllowance);
      console.log(
        `  ${a.row.padEnd(18)} ${a.card.padEnd(31)} → ${a.pair.padEnd(7)} ${a.routes.map((r) => `${r.toFixed(0)} mm`).join(" / ").padEnd(16)} spare ${spare.toFixed(0)} mm`,
      );
    }
  }
}
