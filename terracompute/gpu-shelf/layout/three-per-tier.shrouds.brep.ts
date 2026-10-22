import { threePerTierExpected, threePerTierLayout } from "./options.ts";

// Option C, three cards per tier, with a 3D-printed intake shroud on each GPU's fan side. See options.ts.
const view = { shrouds: true };
export const expected = threePerTierExpected(view);
export default () => threePerTierLayout(view);
