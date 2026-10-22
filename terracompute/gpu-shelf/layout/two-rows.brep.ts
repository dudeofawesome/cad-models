import { twoRowsExpected, twoRowsLayout } from "./options.ts";

// Option B, two rows. See options.ts.
const view = {};
export const expected = twoRowsExpected(view);
export default () => twoRowsLayout(view);
