import { z } from 'zod';
import { DEFAULT_SORT_BY, DEFAULT_AGGREGATE_FUNCTION, config } from "./config.js";
import { store } from "./clickhouse/stores.js";
import { toText } from './fetch/cors.js';
import { NormalizedHistoryData } from './queries.js';

export interface NormalizedHistoryFormat {
    network: string;
    values: number[];
    timestamps: number[];
    interval: number;   
}

export function parseBlockId(block_id?: string|null) {
    // Match against hexadecimal string (with or without '0x' prefix)
    if (!z.string().regex(/^(0x)?[a-fA-F0-9]+$/).safeParse(block_id).success) {
        return undefined;
    }

    return block_id ? block_id.replace("0x", "") : undefined;
}

export function parseBlockNumber(number?: string|null|number) {
    let value = undefined;
    if (number) {
        if (typeof number === "string") value = parseInt(number);
        if (typeof number === "number") value = number;
    }
    // Must be non-negative number
    if ( value && value <= 0 ) value = undefined;
    return value;
}

export function parseChain(chain?: string|null) {
    if (!z.string().regex(/^[a-zA-Z0-9]+$/).safeParse(chain).success) {
        return undefined;
    }

    return chain;
}

export function parseLimit(limit?: string|null|number) {
    let value = 1; // default 1
    if (limit) {
        if (typeof limit === "string") value = parseInt(limit);
        if (typeof limit === "number") value = limit;
    }
    // limit must be between 1 and maxLimit
    if ( value <= 0 ) value = 1;
    if ( value > config.maxLimit ) value = config.maxLimit;
    return value;
}

export function parseSortBy(sort_by?: string|null) {
    if (!z.enum(["ASC", "DESC"]).safeParse(sort_by).success) {
        return DEFAULT_SORT_BY;
    }

    return sort_by;
}

export function parseTimestamp(timestamp?: string|null|number) {
    if (timestamp !== undefined && timestamp !== null) {
        if (typeof timestamp === "string") {
            if (/^[0-9]+$/.test(timestamp)) {
                return parseTimestamp(parseInt(timestamp));
            }
            // append "Z" to timestamp if it doesn't have it
            if (!timestamp.endsWith("Z")) timestamp += "Z";
            return Math.floor(Number(new Date(timestamp)) / 1000);
        }
        if (typeof timestamp === "number") {
            const length = timestamp.toString().length;
            if ( length === 10 ) return timestamp; // seconds
            if ( length === 13 ) return Math.floor(timestamp / 1000); // convert milliseconds to seconds
            throw new Error("Invalid timestamp");
        }
    }
    return undefined;
}

export function parseAggregateFunction(aggregate_function?: string|null) {
    // if not defined by user, use default
    if (!aggregate_function) return DEFAULT_AGGREGATE_FUNCTION;
    // if defined but not valid, return undefined
    else if (!z.enum(["min", "max", "avg", "sum", "count", "median"]).safeParse(aggregate_function).success) {
        return undefined;
    }
    return aggregate_function;
}

// same logic from above
export function parseHistoryRange(range?: string|null) {
    if (!range) return "24h";
    if (!z.enum(["24h", "7d", "30d", "90d", "1y", "all"]).safeParse(range).success) {
        return undefined;
    }

    return  range;
}

// used before running the query to gain time
export async function verifyParameters(req: Request) {
    const url = new URL(req.url);
    // chain
    const chain = url.searchParams.get("chain");
    if(chain && (parseChain(chain) == undefined)) {
        return toText("Invalid chain name: " + chain, 400);
    }
    else if (chain && !(await store.chains)?.includes(chain)) {
        return toText("Chain not found: " + chain, 404);
    }
    // range
    const range = url.searchParams.get("range");
    if(range && (parseHistoryRange(range) == undefined)) {
        return toText("Invalid time range: " + range, 400);
    }
    // aggregate_functions
    const aggregate_function = url.searchParams.get("aggregate_function");
    if(aggregate_function && (parseAggregateFunction(aggregate_function) == undefined)) {
        return toText("Invalid aggregate function: " + aggregate_function, 400);
    }
}

// parses the db response into normalized format for easier further handling
export function parseNormalized(data: NormalizedHistoryData[], interval: number): NormalizedHistoryFormat[] {
    const parsedData: Record<string, NormalizedHistoryFormat> = {};

    data.forEach((dataPoint) => {
      const { chain, value, timestamp } = dataPoint;
  
      if (!parsedData[chain]) {
        parsedData[chain] = {
          network: chain,
          values: [],
          timestamps: [],
          interval: interval,
        };
      }
      // if value is string parseInt it
      if (typeof value === "string") {
            parsedData[chain].values.push(parseInt(value));
      } else {
            parsedData[chain].values.push(value);
      }
      parsedData[chain].timestamps.push(timestamp);

    });
  
    return Object.values(parsedData);
}