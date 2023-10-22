import { expect, test } from "bun:test";
import { getBlock, getChain, parseLimit, parseTimestamp } from "./queries";
import { DEFAULT_MAX_LIMIT } from "./config";

test("getBlock", () => {
    const query = getBlock(new URLSearchParams({ chain: "eth", block_number: "123" }));
    expect(query).toBe(`SELECT * FROM block WHERE (chain == 'eth' AND block_number == '123') ORDER BY block_number DESC LIMIT 1`);
});

test("getChain", () => {
    expect(getChain()).toBe(`SELECT DISTINCT chain FROM block`);
});

test("parseLimit", () => {
    expect(parseLimit()).toBe(1);
    expect(parseLimit(null)).toBe(1);
    expect(parseLimit("10")).toBe(10);
    expect(parseLimit(10)).toBe(10);
    expect(parseLimit(999999)).toBe(DEFAULT_MAX_LIMIT);
});

test("parseTimestamp", () => {
    expect(parseTimestamp()).toBeUndefined();
    expect(parseTimestamp(null)).toBeUndefined();
    expect(parseTimestamp("10")).toBe(10);
    expect(parseTimestamp(1698002824156)).toBe(1698002824156);
    expect(parseTimestamp("2023-01-01T00:00:00.000Z")).toBe(1672531200000);
    expect(parseTimestamp("2023-01-01T00:00:00.000")).toBe(1672531200000);
    expect(parseTimestamp("2023-01-01T00:00:00")).toBe(1672531200000);
    expect(parseTimestamp("2023-01-01")).toBe(1672531200000);
    expect(parseTimestamp("2023-01")).toBe(1672531200000);
    expect(parseTimestamp(Number(new Date("2023")))).toBe(1672531200000);
});


