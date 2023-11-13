import { expect, test } from "bun:test";
import { parseBlockId, parseBlockNumber, parseChain, parseLimit, parseSortBy, parseTimestamp, parseAggregateColumn, parseAggregateFunction } from "./utils.js";
import { DEFAULT_MAX_LIMIT, DEFAULT_SORT_BY } from "./config.js";

test("parseBlockId", () => {
    expect(parseBlockId()).toBeUndefined();
    expect(parseBlockId(null)).toBeUndefined();
    expect(parseBlockId("invalid")).toBeUndefined();
    expect(parseBlockId("00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc")).toBe("00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc");
    expect(parseBlockId("0x00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc")).toBe("00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc");
});

test("parseBlockNumber", () => {
    expect(parseBlockNumber()).toBeUndefined();
    expect(parseBlockNumber(null)).toBeUndefined();
    expect(parseBlockNumber(-1)).toBeUndefined();
    expect(parseLimit("invalid")).toBeNaN();
    expect(parseBlockNumber("10")).toBe(10);
    expect(parseBlockNumber(10)).toBe(10);
});

test("parseChain", () => {
    expect(parseChain()).toBeUndefined();
    expect(parseChain(null)).toBeUndefined();
    expect(parseChain("' OR 1=1)--")).toBeUndefined();
    expect(parseChain("test")).toBe("test");
    expect(parseChain("test123")).toBe("test123");
});

test("parseLimit", () => {
    expect(parseLimit()).toBe(1);
    expect(parseLimit(null)).toBe(1);
    expect(parseLimit(-1)).toBe(1);
    expect(parseLimit("invalid")).toBeNaN();
    expect(parseLimit("10")).toBe(10);
    expect(parseLimit(10)).toBe(10);
    expect(parseLimit(999999)).toBe(DEFAULT_MAX_LIMIT);
});

test("parseSortBy", () => {
    expect(parseSortBy()).toBe(DEFAULT_SORT_BY);
    expect(parseSortBy(null)).toBe(DEFAULT_SORT_BY);
    expect(parseSortBy("invalid")).toBe(DEFAULT_SORT_BY);
    expect(parseSortBy("ASC")).toBe("ASC");
    expect(parseSortBy("DESC")).toBe("DESC");
});

test("parseTimestamp", () => {
    const seconds = 1672531200;
    expect(parseTimestamp()).toBeUndefined();
    expect(parseTimestamp(null)).toBeUndefined();
    expect(parseTimestamp(1672531200000)).toBe(seconds); // Milliseconds (13 digits) => Seconds (10 digits)
    expect(parseTimestamp("1672531200")).toBe(seconds);
    expect(parseTimestamp(1672531200000)).toBe(seconds);
    expect(parseTimestamp("2023-01-01T00:00:00.000Z")).toBe(seconds);
    expect(parseTimestamp("2023-01-01T00:00:00.000")).toBe(seconds);
    expect(parseTimestamp("2023-01-01 00:00:00")).toBe(seconds); // Datetime
    expect(parseTimestamp("2023-01-01T00:00:00Z")).toBe(seconds); // ISO
    expect(parseTimestamp("2023-01-01T00:00:00")).toBe(seconds);
    expect(parseTimestamp("2023-01-01")).toBe(seconds);
    expect(parseTimestamp("2023-01")).toBe(seconds);
    expect(parseTimestamp(Number(new Date("2023")))).toBe(seconds);

    // errors
    expect(() => parseTimestamp(10)).toThrow("Invalid timestamp");
    expect(() => parseTimestamp("10")).toThrow("Invalid timestamp");
});

test("parseAggregateFunction", () => {
    expect(parseAggregateFunction()).toBe("count");
    expect(parseAggregateFunction(null)).toBe("count");
    expect(parseAggregateFunction("invalid")).toBe("count");
    expect(parseAggregateFunction("count")).toBe("count");
    expect(parseAggregateFunction("sum")).toBe("sum");
    expect(parseAggregateFunction("avg")).toBe("avg");
    expect(parseAggregateFunction("min")).toBe("min");
    expect(parseAggregateFunction("max")).toBe("max");
});

test("parseAggregateColumn", () => {
    expect(parseAggregateColumn()).toBeUndefined();
    expect(parseAggregateColumn(null)).toBeUndefined();
    expect(parseAggregateColumn("invalid")).toBeUndefined();
    expect(parseAggregateColumn("transaction_traces")).toBe("transaction_traces");
    expect(parseAggregateColumn("trace_calls")).toBe("trace_calls");
    expect(parseAggregateColumn("total_uaw")).toBe("total_uaw");
});