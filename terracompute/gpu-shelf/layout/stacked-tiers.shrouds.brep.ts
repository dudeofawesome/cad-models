import { stackedTiersExpected, stackedTiersLayout } from "./options.ts";

// Option A, stacked tiers, with a 3D-printed intake shroud on each GPU's fan side. See options.ts.
const view = { shrouds: true };
export const expected = stackedTiersExpected(view);
export default () => stackedTiersLayout(view);
