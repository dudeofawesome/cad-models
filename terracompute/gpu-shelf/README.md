# Full-Machine Rack Chassis

A rack-mount chassis for the entire Terracompute machine, including 8 GPUs, the motherboard, and all power supplies, built from aluminum stock and off-the-shelf rack parts. The existing `gpu-shelf/` directory contains this full-machine design.

4U is an initial suggestion, not a height constraint. The rack is currently empty, so chassis height can be chosen to accommodate the complete machine, airflow, cabling, and service access.

## Reference bodies

`references/` holds models of the parts the chassis must hold, for laying them out and checking clearances. Each part has:

- a **body**: the part itself, with enough detail (fans, RAM, ports, connectors, handles) to recognize it at a glance
- **keepouts**: the empty space it needs for plugs, cable bends, and airflow, modeled as solid boxes so a layout can check them for collisions

Files:

- `models/`: one file per part (`motherboard.ts`, `gpu.ts`, `device-adapter.ts`, `psu.ts`, `drives.ts`) plus shared helpers (`shapes.ts`); `models.ts` re-exports them all. Units are mm, Z up; each file describes its part's origin and axes
- `dimensions.md`: where every number came from (published spec, user measurement, or assumption)
- one `.brep.ts` per part for previewing it on its own: `motherboard`, `device-adapter`, `psu-module` (Dell PSU plugged into its breakout board), `atx-psu`, `gpus` (one of each card model), `u2-drives`. Each shows only the body; set `showKeepouts: true` at the top of the file to add the keepouts

Overall sizes, mounting holes, and connector positions come from measurements, the manual, or photos. Smaller details marked "cosmetic" (fan sizes, heatsink fins, handle shape) are there only to make parts recognizable. Numbers marked "assumed" are estimates to confirm before the chassis is finalized.

## Layout

`layout/` places the reference bodies in the rack to compare arrangements before designing structure. Rack frame: X across the rack (0 on the centerline), Y from the front rail plane toward the rear, Z up from the bottom of the lowest tier.

Both options share these choices:

- **Airflow front to back**, with a wall of three 140 mm fans at the front of each tier.
- **Motherboard tier at the bottom (4U):** I/O edge at the front, with the fans above the ports so the ports stay reachable. The four Dell PSU sets sit behind the board with cords at the rear; the ATX PSU and U.2 drives sit on a shelf above them.
- **GPUs stand on their slot edges** with their lengths running front to back and brackets at the rear. Only the brackets are fixed, to a rail behind them; each SlimSAS adapter rests under its card on standoffs, so adapters can be swapped by lifting the card. The adapters' cables leave toward the rear and drop straight down to the motherboard's SlimSAS connectors.
- Cards are spaced so each adapter's cables clear the next card, which leaves 36–43 mm between cards for their fans to draw air.

| Option | Arrangement | Height |
|---|---|---|
| A, `stacked-tiers` | two GPU tiers of four (Founders Edition cards in one, partner cards in the other), each with its own fresh air | 14U |
| B, `two-rows` | one GPU tier with a front and a rear row; the rear row breathes air the front row has heated | 9U |

Both options are defined in `options.ts`. Each has three view files: `<option>.brep.ts` (plain), `<option>.ducts.brep.ts` (thin side sheets and a top turn each GPU tier into a front-to-back duct), and `<option>.keepouts.brep.ts` (reserved cable space shown).

Floors, the PSU shelf, and bracket rails are placeholders, not designed structure. Each layout throws if any part's body runs into another part's body or keepout.

## Viewing every model

`pnpm --filter terracompute export` writes a STEP file for every reference part and layout view to `gpu-shelf/output/` (not committed). With the viewer running (`pnpm --filter terracompute dev:layout`), open any of them at:

```
http://127.0.0.1:7373/?dir=<absolute path to gpu-shelf/output, URL-encoded>&file=<name>.step
```

where `<name>` is the `.brep.ts` file name without `.brep.ts`, e.g. `stacked-tiers.ducts`. Re-run the export after changing a model.
