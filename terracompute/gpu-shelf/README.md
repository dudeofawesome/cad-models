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
