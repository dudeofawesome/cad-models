import { threePerTierExpected, threePerTierLayout } from "./options.ts";

// Option C, three cards per tier, with flat dividers between the cards. See options.ts.
const view = { dividers: true };
export const expected = threePerTierExpected(view);
export default () => threePerTierLayout(view);
