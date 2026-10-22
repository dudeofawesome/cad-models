import { threePerTierExpected, threePerTierLayout } from "./options.ts";

// Option C, three cards per tier. See options.ts.
const view = {};
export const expected = threePerTierExpected(view);
export default () => threePerTierLayout(view);
