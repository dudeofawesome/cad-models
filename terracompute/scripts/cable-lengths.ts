// Print the estimated SlimSAS cable routes for each layout option.
// Run: node scripts/cable-lengths.ts (from terracompute/)
import { cable, planCables } from "../gpu-shelf/layout/cables.ts";
import { stackedTiersCables, twoRowsCables } from "../gpu-shelf/layout/options.ts";

const options = [
  { name: "A, stacked tiers", rows: stackedTiersCables() },
  { name: "B, two rows", rows: twoRowsCables() },
];

for (const { name, rows } of options) {
  const plan = planCables(rows, 0);
  console.log(`\nOption ${name}: longest route ${plan.longest.toFixed(0)} mm of ${plan.maxRoute.toFixed(0)} mm allowed`);
  for (const a of plan.assignments) {
    const spare = cable.length - 2 * cable.plug - Math.max(...a.routes) * (1 + cable.routingAllowance);
    console.log(
      `  ${a.row.padEnd(18)} ${a.card.padEnd(31)} → ${a.pair.padEnd(11)} ${a.routes.map((r) => `${r.toFixed(0)} mm`).join(" / ").padEnd(16)} spare ${spare.toFixed(0)} mm`,
    );
  }
}
