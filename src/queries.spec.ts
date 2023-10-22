import { expect, test } from "bun:test";
import { getBlock, parseLimit } from "./queries";
import { DEFAULT_MAX_LIMIT } from "./config";

test("getBlock", () => {
    const query = getBlock(new URLSearchParams({ chain: "eth", block_number: "123" }));
    expect(query).toBe(`SELECT * FROM block WHERE (chain == 'eth' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);
});

test("parseLimit", () => {
    expect(parseLimit()).toBe(1);
    expect(parseLimit(null)).toBe(1);
    expect(parseLimit("10")).toBe(10);
    expect(parseLimit(10)).toBe(10);
    expect(parseLimit(999999)).toBe(DEFAULT_MAX_LIMIT);
});
