import { threePerTierExpected, threePerTierLayout } from "./options.ts";

// Option C, three cards per tier, showing the space reserved for cables. See options.ts.
const view = { keepouts: true };
export const expected = threePerTierExpected(view);
export default () => threePerTierLayout(view);
