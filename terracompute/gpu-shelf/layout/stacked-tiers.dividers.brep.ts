import { stackedTiersExpected, stackedTiersLayout } from "./options.ts";

// Option A, stacked tiers, with flat dividers between the cards. See options.ts.
const view = { dividers: true };
export const expected = stackedTiersExpected(view);
export default () => stackedTiersLayout(view);
