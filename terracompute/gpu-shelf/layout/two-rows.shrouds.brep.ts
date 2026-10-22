import { twoRowsExpected, twoRowsLayout } from "./options.ts";

// Option B, two rows, with a 3D-printed intake shroud on each GPU's fan side. See options.ts.
const view = { shrouds: true };
export const expected = twoRowsExpected(view);
export default () => twoRowsLayout(view);
