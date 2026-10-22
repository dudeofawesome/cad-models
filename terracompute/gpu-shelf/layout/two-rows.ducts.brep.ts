import { twoRowsExpected, twoRowsLayout } from "./options.ts";

// Option B, two rows, with each GPU tier wrapped in thin duct sheets. See options.ts.
const view = { ducts: true };
export const expected = twoRowsExpected(view);
export default () => twoRowsLayout(view);
