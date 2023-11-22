import { expect, jest, mock, test } from "bun:test";
import { createBlockQuery, getBlock, getAggregate } from "./queries.js";
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
    const date_of_query = Math.floor(Number(new Date().setHours(0,0,0,0)) / 1000);
    const datetime_of_query = Math.floor(Number(new Date()) / 1000);
    expect(getAggregate(new URLSearchParams({ chain: "wax" }), "trace_calls"))
        .toBe(`SELECT chain, toUnixTimestamp(DATE(timestamp)) as timestamp, sum(trace_calls) as value FROM BlockStats WHERE (timestamp BETWEEN ${datetime_of_query} - 3600 * 24 AND ${datetime_of_query} AND chain == 'wax') GROUP BY chain, timestamp ORDER BY timestamp ASC`);

    expect(getAggregate(new URLSearchParams({ range: "7d"}), "transaction_traces"))
        .toBe(`SELECT chain, toUnixTimestamp(DATE(timestamp)) as timestamp, sum(transaction_traces) as value FROM BlockStats WHERE (timestamp BETWEEN ${date_of_query} - 86400 * 7 AND ${date_of_query}) GROUP BY chain, timestamp ORDER BY timestamp ASC`);
});
