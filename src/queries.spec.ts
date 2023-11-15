import { expect, jest, mock, test } from "bun:test";
import { createBlockQuery, getBlock, getAggregate, getDAW } from "./queries.js";
import { store } from "./clickhouse/stores.js";

// Mock supported chains data to prevent DB query
//mock.module("./fetch/chains.ts", () => ({ supportedChainsQuery: jest.fn().mockResolvedValue(["eth", "polygon"]) }));

test("createBlockQuery", () => {
    expect(createBlockQuery(new URLSearchParams({ chain: "eth", block_number: "123" })))
        .toBe(`SELECT * FROM blocks WHERE (chain == 'eth' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);

    expect(createBlockQuery(new URLSearchParams({ chain: "eth", greater_or_equals_by_timestamp: '1438270048', less_or_equals_by_timestamp: '1438270083', limit: '3' })))
        .toBe(`SELECT * FROM blocks WHERE (toUnixTimestamp(timestamp) >= 1438270048 AND toUnixTimestamp(timestamp) <= 1438270083 AND chain == 'eth') ORDER BY block_number DESC LIMIT 3`);
});

test("getBlock", async () => {
    const singleChainQuery = new URLSearchParams({ chain: "eth", block_number: "123" });
    expect(getBlock(singleChainQuery)).resolves.toBe(createBlockQuery(singleChainQuery));

    // Check that if no chain parameter is passed, all chains are included in the selection
    let supportedChains = await store.chains;
    if (!supportedChains) {
        throw new Error("chains is null");
    }
    supportedChains.forEach((chain) => {
        expect(getBlock(new URLSearchParams({ block_number: "123" }))).resolves
        .toContain(`SELECT * FROM blocks WHERE (chain == '${chain}' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);
    });
});

test("getAggregate", async () => {
    const singleChainQuery = new URLSearchParams({ chain: "wax"});
    expect(getAggregate(singleChainQuery, "trace_calls"))
        .toBe(`SELECT chain, count(trace_calls) FROM BlockStats WHERE (chain == 'wax') GROUP BY chain`);

    expect(getAggregate(new URLSearchParams(), "transaction_traces"))
        .toBe(`SELECT chain, count(transaction_traces) FROM BlockStats GROUP BY chain`);
});

test("getDAW", async () => {
    const singleChainQuery = new URLSearchParams({ chain: "wax"});
    expect(getDAW(singleChainQuery))
        .toBe(`SELECT chain, count(distinct uaw) FROM BlockStats ARRAY JOIN uaw WHERE (chain == 'wax') GROUP BY chain`);

    expect(getDAW(new URLSearchParams({ date: "2023-09-06" })))
        .toBe(`SELECT chain, count(distinct uaw) FROM BlockStats ARRAY JOIN uaw WHERE (DATE(timestamp) == '2023-09-06') GROUP BY chain`);
});
