import { box } from "brepjs";

// All dimensions are in millimeters. This block is a scaffold for the tooling,
// not a Gridfinity base or a fitted charging-dock holder.
export const parameters = {
  width: 40,
  depth: 40,
  height: 7,
};

export default function bin() {
  return box(parameters.width, parameters.depth, parameters.height);
}
