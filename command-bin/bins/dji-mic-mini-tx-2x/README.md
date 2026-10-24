# DJI Mic Mini TX dual bin

A Gridfinity bin for charging 2 DJI Mic Mini TX modules in their charging docks. Includes cable management channels to help route USB cables from neighboring bins.

## Bin

The bin occupies 2 × 1 Gridfinity cells (83.5 × 41.5 mm) and is 14 mm tall without a stacking lip. Two feet have the 0.8 / 1.8 / 2.15 mm mating profile and eight underside Ø6.5 × 2.4 mm glue pockets for nominal 6 × 2 mm magnets. Both docks face the same direction on 42 mm centers; check magnetic interaction with the actual transmitters installed.

Each dock sits in a 3 mm deep pocket offset 0.3 mm outward from the supplied bottom outline. Two 3 mm wide side tabs retain each dock at its 0.4 mm deep lip starting 2.3 mm above the bottom. Flat retaining ledges sit 2.4 mm above the pocket floor, with 0.25 mm lip engagement and 0.1 mm vertical clearance. A 45° underside ramp spans the pocket clearance, leaving only the 0.25 mm retaining ledge unsupported; upper ramps ease insertion. Print to check insertion and retention during upward TX removal; adjust `dockClearance`, `dockPocketDepth` and the `dockTab…` parameters in `bin.brep.ts` as needed. Rear plug access slots leave room for the dock cables. The assumed rear USB orientation still needs confirmation.

Top-front and top-back routing channels each hold two nominal Ø3.2 mm cables stacked vertically (four routed cables total). Each channel has two Ø3.1 mm round seats on 3.2 mm vertical centers, providing 0.1 mm diametral interference, with a continuous 2.6 mm top slot for pressing cables in without threading connectors. Load the lower cable first. The channels are 7.1 mm deep and run through both ends; the rear upper retaining lips are interrupted at the two dock USB access slots. Fit depends on the cable jacket and print tolerances: tune `cableDiameter`, `cableInterference`, and `cableSlotWidth` in `bin.brep.ts` after a fit print. `cablesPerChannel` controls capacity; increasing it may require a taller bin to preserve the floor above the feet.

Run from the repository root inside devenv:

```sh
devenv shell --quiet -- pnpm --filter command-bin dev
devenv shell --quiet -- pnpm --filter command-bin dev:assembly
devenv shell --quiet -- pnpm --filter command-bin verify
devenv shell --quiet -- pnpm --filter command-bin build
```

`dev` previews the printable bin; `dev:assembly` adds dock and cable envelopes with the TXs lifted for inspection. `build` exports `output/bin.step` after validation.

## Reference models

Preview the reference layout from the repository root:

```sh
devenv shell --quiet -- pnpm --filter command-bin dev:references
devenv shell --quiet -- pnpm --filter command-bin verify:references
```

The reusable envelopes in `references/models.ts` use millimeters, with X across the transmitter, Y toward its back, and Z upward. Each component is also available as an individual `.brep.ts` file. The layout shows two stations 42 mm apart, facing the same direction, with the transmitters lifted above the docks for inspection.

The TX envelope uses [DJI's published 26.55 × 26.06 × 15.96 mm dimensions](https://www.dji.com/mic-mini/specs), oriented upright as 26.55 mm wide × 15.96 mm deep × 26.06 mm tall. It does not reproduce the detailed housing, windscreen, or removable clip magnet.

The dock bottom outline comes from the Fusion sketch in `references/bottom.dxf`, with a nominal 32.3 × 22.75 mm footprint. `dock-footprint.ts` reads its millimeter units and converts the four degree-5 splines to exact Bezier spans, excluding dashed construction lines and points. The profile retains the DXF's orientation and is translated to center the nominal construction box on the origin. The splines slightly overshoot that box. The dock reference keeps this bottom envelope to the measured 2.3 mm lip shoulder and insets the upper housing by the measured 0.4 mm lip depth. Its 10 mm overall height, detailed side surfaces, rear USB port location and orientation, and generic USB plug/cable envelope remain **unmeasured estimates**. The reference supports clearance checks; insertion force and retention require a physical fit check.

Before fitting the bin, confirm the dock's profile above the bottom, height, USB port position and orientation, inserted plug projection and overmold size, cable bend clearance, TX seated position, and the TX removal path. Confirm magnetic interaction with both TXs installed. Update the shared dimensions before deriving cavities from these references.
