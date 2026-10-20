# DJI Mic Mini TX dual bin

A Gridfinity bin for charging 2 DJI Mic Mini TX modules in their charging docks. Includes cable management channels to help route USB cables from neighboring bins.

## Reference models

Preview the reference layout from the repository root:

```sh
devenv shell --quiet -- pnpm --filter command-bin dev:references
devenv shell --quiet -- pnpm --filter command-bin verify:references
```

The reusable envelopes in `references/models.ts` use millimeters, with X across the transmitter, Y toward its back, and Z upward. Each component is also available as an individual `.brep.ts` file. The layout shows two stations 42 mm apart, facing the same direction, with the transmitters lifted above the docks for inspection.

The TX envelope uses [DJI's published 26.55 × 26.06 × 15.96 mm dimensions](https://www.dji.com/mic-mini/specs), oriented upright as 26.55 mm wide × 15.96 mm deep × 26.06 mm tall. It does not reproduce the detailed housing, windscreen, or removable clip magnet.

The dock bottom outline comes from the Fusion sketch in `references/bottom.dxf`, with a nominal 32.3 × 22.75 mm footprint. `dock-footprint.ts` reads its millimeter units and converts the four degree-5 splines to exact Bezier spans, excluding dashed construction lines and points. The profile retains the DXF's orientation and is translated to center the nominal construction box on the origin. The splines slightly overshoot that box. The dock reference extrudes this contour vertically; its 10 mm height, side profile, rear USB port location and orientation, and generic USB plug/cable envelope remain **unmeasured estimates**. The preview does not establish docking engagement, retention, removal direction, or a fitted pocket.

Before fitting the bin, confirm the dock's profile above the bottom, height, USB port position and orientation, inserted plug projection and overmold size, cable bend clearance, TX seated position, and the TX removal path. Confirm magnetic interaction with both TXs installed. Update the shared dimensions before deriving cavities from these references.
