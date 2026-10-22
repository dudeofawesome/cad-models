import { threePerTierExpected, threePerTierLayout } from "./options.ts";

// Option C, three cards per tier, with each GPU tier wrapped in thin duct sheets. See options.ts.
const view = { ducts: true };
export const expected = threePerTierExpected(view);
export default () => threePerTierLayout(view);
