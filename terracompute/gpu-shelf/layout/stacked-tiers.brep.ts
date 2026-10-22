import { stackedTiersExpected, stackedTiersLayout } from "./options.ts";

// Option A, stacked tiers. See options.ts.
const view = {};
export const expected = stackedTiersExpected(view);
export default () => stackedTiersLayout(view);
