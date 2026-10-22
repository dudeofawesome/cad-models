import { twoRowsExpected, twoRowsLayout } from "./options.ts";

// Option B, two rows, showing the space reserved for cables. See options.ts.
const view = { keepouts: true };
export const expected = twoRowsExpected(view);
export default () => twoRowsLayout(view);
