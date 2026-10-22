// Reference models of the parts the chassis must hold. Units: mm, Z up.
// Sources for every number are in dimensions.md; values marked "assumed"
// or "cosmetic" there or in the model files are estimates.
//
// Each part has a body (what it is) and keepouts (empty space it needs for
// plugs, cable bends, and airflow). Keepouts are modeled as solids so a
// layout can check them for collisions; the body detail is for
// recognizing parts at a glance, and is only as accurate as its source.

export * from "./models/shapes.ts";
export * from "./models/motherboard.ts";
export * from "./models/gpu.ts";
export * from "./models/device-adapter.ts";
export * from "./models/psu.ts";
export * from "./models/drives.ts";
export * from "./models/fan.ts";
