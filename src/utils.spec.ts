import { expect, test } from "bun:test";
import { parseLimit, parseTimestamp } from "./utils";
import { DEFAULT_MAX_LIMIT } from "./config";

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
    expect(parseTimestamp(1672531200)).toBe(1672531200000); // Seconds (10 digits) => Milliseconds
    expect(parseTimestamp("1672531200")).toBe(1672531200000);
    expect(parseTimestamp(1672531200000)).toBe(1672531200000);
    expect(parseTimestamp("2023-01-01T00:00:00.000Z")).toBe(1672531200000);
    expect(parseTimestamp("2023-01-01T00:00:00.000")).toBe(1672531200000);
    expect(parseTimestamp("2023-01-01 00:00:00")).toBe(1672531200000); // Datetime
    expect(parseTimestamp("2023-01-01T00:00:00Z")).toBe(1672531200000); // ISO
    expect(parseTimestamp("2023-01-01T00:00:00")).toBe(1672531200000);
    expect(parseTimestamp("2023-01-01")).toBe(1672531200000);
    expect(parseTimestamp("2023-01")).toBe(1672531200000);
    expect(parseTimestamp(Number(new Date("2023")))).toBe(1672531200000);

    // errors
    expect(() => parseTimestamp(10)).toThrow("Invalid timestamp");
    expect(() => parseTimestamp("10")).toThrow("Invalid timestamp");
});


