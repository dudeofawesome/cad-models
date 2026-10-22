import { stackedTiersExpected, stackedTiersLayout } from "./options.ts";

// Option A, stacked tiers, with each GPU tier wrapped in thin duct sheets. See options.ts.
const view = { ducts: true };
export const expected = stackedTiersExpected(view);
export default () => stackedTiersLayout(view);
