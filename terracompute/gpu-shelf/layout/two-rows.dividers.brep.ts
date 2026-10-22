import { twoRowsExpected, twoRowsLayout } from "./options.ts";

// Option B, two rows, with flat dividers between the cards. See options.ts.
const view = { dividers: true };
export const expected = twoRowsExpected(view);
export default () => twoRowsLayout(view);
