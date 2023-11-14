import { expect, jest, mock, test } from "bun:test";
import { createBlockQuery, getBlock, getChain, getAggregate, createAggregateQuery } from "./queries.js";
import { supportedChainsQuery } from "./fetch/chains.js";

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
    let supportedChains = await supportedChainsQuery();
    supportedChains.forEach((chain) => {
        expect(getBlock(new URLSearchParams({ block_number: "123" }))).resolves
        .toContain(`SELECT * FROM blocks WHERE (chain == '${chain}' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);
    });
});

test("getChain", () => {
    expect(getChain()).toBe(`SELECT DISTINCT chain FROM module_hashes`);
});

test("createAggregateQuery", () => {
    expect(createAggregateQuery(new URLSearchParams({aggregate_function: 'count'}), "trace_calls"))
    .toBe(`SELECT chain, count(trace_calls) FROM BlockStats GROUP BY chain`);

    expect(createAggregateQuery(new URLSearchParams({aggregate_function: 'max'}), "transaction_traces"))
    .toBe(`SELECT chain, max(transaction_traces) FROM BlockStats GROUP BY chain`);
});

test("getAggregate", async () => {
    const singleChainQuery = new URLSearchParams({ chain: "wax"});
    expect(getAggregate(singleChainQuery, "trace_calls")).resolves.toBe(createAggregateQuery(singleChainQuery, "trace_calls"));

    // Check that if no chain parameter is passed, all chains are included in the selection
    let supportedChains = await supportedChainsQuery();
    supportedChains.forEach((chain) => {
        expect(getAggregate(new URLSearchParams({ block_number: "123" }), "trace_calls")).resolves
        .toContain(`SELECT chain, count(trace_calls) FROM BlockStats WHERE (block_number == '123' AND chain == '${chain}') GROUP BY chain`);
    });
});