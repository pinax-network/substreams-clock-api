import { config } from './config';

export interface Block {
    block_number: number;
    block_id: string;
    timestamp: string;
    chain: string;
}
export function parseLimit(limit?: string|null|number) {
    let value = 1; // default 1
    if (limit) {
        if (typeof limit === "string") value = parseInt(limit);
        if (typeof limit === "number") value = limit;
    }
    // limit must be between 1 and maxLimit
    if ( value > config.maxLimit ) value = config.maxLimit;
    return value;
}

export function parseTimestamp(timestamp?: string|null|number) {
    if (timestamp) {
        if (typeof timestamp === "string") {
            if (/^[0-9]+$/.test(timestamp)) {
                return parseTimestamp(parseInt(timestamp));
            }
            // append "Z" to timestamp if it doesn't have it
            if (!timestamp.endsWith("Z")) timestamp += "Z";
            return Number(new Date(timestamp));
        }
        if (typeof timestamp === "number") {
            if ( timestamp.toString().length === 10 ) return timestamp * 1000; // convert seconds to milliseconds
            return timestamp;
        }
    }
    return undefined;
}

export function getBlock(searchParams: URLSearchParams) {
    // URL Params
    const chain = searchParams.get("chain");
    const block_number = searchParams.get("block_number");
    const block_id = searchParams.get("block_id");
    const timestamp = parseTimestamp(searchParams.get("timestamp"));
    const limit = parseLimit(searchParams.get("limit"));
    // TO-DO: Timestamp parsing ("2021-10-19" => UTC Milliseconds)
    // TO-DO: lessOrEquals, greaterOrEquals, less & greater block number & timestamp
    // TO-DO: Modulo block number (ex: search by every 1M blocks)

    // SQL Query
    let query = `SELECT * FROM ${config.table}`;
    const where = [];
    if ( chain ) where.push(`chain == '${chain}'`);
    if ( block_id ) where.push(`block_id == '${block_id}'`);
    if ( block_number ) where.push(`block_number == '${block_number}'`);
    if ( timestamp ) where.push(`timestamp == '${timestamp}'`);
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;
    query += ' ORDER BY block_number DESC'
    query += ` LIMIT ${limit}`
    return query;
}

export function getChain() {
    return `SELECT DISTINCT chain FROM ${config.table}`;
}
