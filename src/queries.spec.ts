import { expect, test } from "bun:test";
import { getBlock, getChain } from "./queries.js";
import { chains } from './fetch/openapi.js';

test("getBlock", () => {
    expect(getBlock(new URLSearchParams({ chain: "eth", block_number: "123" })))
        .toBe(`SELECT * FROM blocks WHERE (chain == 'eth' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);

    expect(getBlock(new URLSearchParams({ chain: "eth", greater_or_equals_by_timestamp: '1438270048', less_or_equals_by_timestamp: '1438270083', limit: '3' })))
        .toBe(`SELECT * FROM blocks WHERE (toUnixTimestamp(timestamp) >= 1438270048 AND toUnixTimestamp(timestamp) <= 1438270083 AND chain == 'eth') ORDER BY block_number DESC LIMIT 3`);

    // Check that if not chain parameter is passed, all chains are included in the selection
    chains.forEach((chain) => {
        expect(getBlock(new URLSearchParams({ block_number: "123" })))
        .toContain(`SELECT * FROM blocks WHERE (chain == '${chain}' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);
    });
});

test("getChain", () => {
    expect(getChain()).toBe(`SELECT DISTINCT chain FROM module_hashes`);
});