import { stackedTiersExpected, stackedTiersLayout } from "./options.ts";

// Option A, stacked tiers, showing the space reserved for cables. See options.ts.
const view = { keepouts: true };
export const expected = stackedTiersExpected(view);
export default () => stackedTiersLayout(view);
