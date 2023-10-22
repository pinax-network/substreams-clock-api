import { expect, test } from "bun:test";
import { getBlock, getChain } from "./queries";

test("getBlock", () => {
    const query = getBlock(new URLSearchParams({ chain: "eth", block_number: "123" }));
    expect(query).toBe(`SELECT * FROM block WHERE (chain == 'eth' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);
});

test("getChain", () => {
    expect(getChain()).toBe(`SELECT DISTINCT chain FROM block`);
});
